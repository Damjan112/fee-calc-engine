import { Injectable, Logger } from '@nestjs/common';
import { Transaction } from './transaction.entity';
import { Client } from '../clients/client.entity';
import { ClientsService } from '../clients/clients.service';
import { RuleService } from '../rules/rule.service';
import { HistoryService } from '../history/history.service';
import { AppliedRule } from './interfaces/applied-rule.interface';
import { FeeCalculationResult } from './interfaces/fee-calculation-result.interface';
import { BatchCalculationResult } from './interfaces/batch-calculation-result.interface';
import { CalculateFeeDto } from './dto/calculate-fee.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Injectable()
export class FeeCalculationService {
  private readonly logger = new Logger(FeeCalculationService.name);
  
  // Performance constants
  private readonly MIN_CHUNK_SIZE = 10;
  private readonly MAX_CHUNK_SIZE = 50;
  private readonly BACKPRESSURE_DELAY_MS = 10;
  private readonly MAX_ERRORS_TO_STORE = 10;
  private readonly LARGE_BATCH_THRESHOLD = 1000;
  private readonly PROGRESS_LOG_THRESHOLD = 100;

  constructor(
    private readonly ruleService: RuleService,
    private readonly clientsService: ClientsService,
    private readonly historyService: HistoryService,
  ) {}

  async calculateFeePure(
    transactionData: any,
    clientData: any,
  ): Promise<FeeCalculationResult> {
    // Create temporary objects without persisting to database
    const tempClientId = 'temp-client-' + Date.now();
    const tempTransaction = {
      id: 'temp-transaction-' + Date.now(),
      type: transactionData.type,
      amount: transactionData.amount,
      currency: transactionData.currency || 'EUR',
      clientId: tempClientId,
      createdAt: new Date(),
    } as Transaction;

    const tempClient = {
      id: tempClientId,
      name: clientData.name,
      creditScore: clientData.creditScore,
      segment: clientData.segment,
      email: clientData.email,
    } as Client;

    return this.calculateFee(tempTransaction, tempClient);
  }

  async calculateFee(
    transaction: Transaction,
    client: Client,
  ): Promise<FeeCalculationResult> {
    const startTime = Date.now();
    const appliedRules: AppliedRule[] = [];
    const errors: string[] = [];
    let fee = 0;

    try {
      // Validate inputs
      this.validateInputs(transaction, client);

      // Evaluate rules using json-rules-engine
      const ruleResults = await this.ruleService.evaluateRules(
        transaction,
        client,
      );

      // Process rule results
      ruleResults.forEach((result) => {
        try {
          fee += result.feeAmount;
          appliedRules.push({
            id: result.ruleId.toString(),
            description: result.description,
            fee: result.feeAmount,
          });

          this.logger.debug(
            `Applied rule ${result.ruleName}: ${result.feeAmount > 0 ? '+' : ''}${result.feeAmount.toFixed(2)}€`,
          );
        } catch (error: any) {
          const errorMsg = `Error processing rule ${result.ruleName}: ${error.message}`;
          errors.push(errorMsg);
          this.logger.error(errorMsg, error.stack);
        }
      });

      // Round fee as per business rules
      fee = Math.round(fee * 100) / 100;

      const calculationTime = Date.now() - startTime;

      this.logger.log(
        `Fee calculated: ${fee.toFixed(2)}€ for transaction ${transaction.id} ` +
          `(${appliedRules.length} rules applied, ${calculationTime}ms)`,
      );

      const result: FeeCalculationResult = {
        transaction,
        client,
        fee,
        totalAmount: Number(transaction.amount) + fee,
        appliedRules,
        calculationTime,
        ...(errors.length > 0 && { errors }),
      };

      // Record calculation in history (async, don't wait)
      this.historyService.recordSingleCalculation(result).catch((error) => {
        this.logger.error(
          `Failed to record calculation history: ${error.message}`,
        );
      });

      return result;
    } catch (error: any) {
      this.logger.error(
        `Fee calculation failed for transaction ${transaction.id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async batchCalculateFeePure(
    requests: CalculateFeeDto[],
  ): Promise<BatchCalculationResult> {
    const startTime = Date.now();
    const chunkSize = this.calculateOptimalChunkSize(requests.length);
    const batchMetrics = this.initializeBatchMetrics();

    this.logBatchStart(requests.length, chunkSize);

    try {
      await this.processRequestsInChunksPure(requests, chunkSize, batchMetrics);

      return this.buildBatchResult(batchMetrics, startTime, requests.length);
    } catch (error: any) {
      this.logger.error(
        `Pure batch calculation failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async batchCalculateFee(
    requests: CalculateFeeDto[],
    transactionCreator: (dto: CreateTransactionDto) => Promise<Transaction>,
  ): Promise<BatchCalculationResult> {
    const startTime = Date.now();
    const chunkSize = this.calculateOptimalChunkSize(requests.length);
    const batchMetrics = this.initializeBatchMetrics();

    this.logBatchStart(requests.length, chunkSize);

    try {
      await this.processRequestsInChunks(
        requests,
        chunkSize,
        transactionCreator,
        batchMetrics,
      );

      return this.buildBatchResult(batchMetrics, startTime, requests.length);
    } catch (error: any) {
      this.logger.error(
        `Batch calculation failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private calculateOptimalChunkSize(totalRequests: number): number {
    return Math.min(this.MAX_CHUNK_SIZE, Math.max(this.MIN_CHUNK_SIZE, Math.floor(totalRequests / 10)));
  }

  private initializeBatchMetrics() {
    return {
      processedCount: 0,
      failedCount: 0,
      totalAmount: 0,
      totalFee: 0,
      errors: [] as string[],
    };
  }

  private logBatchStart(totalRequests: number, chunkSize: number): void {
    this.logger.log(
      `Starting batch calculation for ${totalRequests} transactions (chunk size: ${chunkSize})`,
    );
  }

  private async processRequestsInChunksPure(
    requests: CalculateFeeDto[],
    chunkSize: number,
    metrics: any,
  ): Promise<void> {
    for (let i = 0; i < requests.length; i += chunkSize) {
      const chunk = requests.slice(i, i + chunkSize);
      const chunkStartTime = Date.now();

      const chunkResults = await this.processChunkPure(
        chunk,
        i,
        metrics.errors,
      );

      this.updateMetricsFromChunkResults(chunkResults, metrics);
      this.logChunkProgress(requests.length, i, chunkSize, chunkStartTime);

      await this.applyBackpressureIfNeeded(requests.length, i, chunkSize);
    }
  }

  private async processRequestsInChunks(
    requests: CalculateFeeDto[],
    chunkSize: number,
    transactionCreator: (dto: CreateTransactionDto) => Promise<Transaction>,
    metrics: any,
  ): Promise<void> {
    for (let i = 0; i < requests.length; i += chunkSize) {
      const chunk = requests.slice(i, i + chunkSize);
      const chunkStartTime = Date.now();

      const chunkResults = await this.processChunk(
        chunk,
        i,
        transactionCreator,
        metrics.errors,
      );

      this.updateMetricsFromChunkResults(chunkResults, metrics);
      this.logChunkProgress(requests.length, i, chunkSize, chunkStartTime);

      await this.applyBackpressureIfNeeded(requests.length, i, chunkSize);
    }
  }

  private async processChunkPure(
    chunk: CalculateFeeDto[],
    chunkStartIndex: number,
    errors: string[],
  ): Promise<Array<{ success: boolean; amount: number; fee: number }>> {
    const chunkPromises = chunk.map((request, index) =>
      this.processSingleRequestPure(request, chunkStartIndex + index, errors),
    );

    return await Promise.all(chunkPromises);
  }

  private async processChunk(
    chunk: CalculateFeeDto[],
    chunkStartIndex: number,
    transactionCreator: (dto: CreateTransactionDto) => Promise<Transaction>,
    errors: string[],
  ): Promise<Array<{ success: boolean; amount: number; fee: number }>> {
    const chunkPromises = chunk.map((request, index) =>
      this.processSingleRequest(
        request,
        chunkStartIndex + index,
        transactionCreator,
        errors,
      ),
    );

    return await Promise.all(chunkPromises);
  }

  private async processSingleRequestPure(
    request: CalculateFeeDto,
    globalIndex: number,
    errors: string[],
  ): Promise<{ success: boolean; amount: number; fee: number }> {
    try {
      const { transaction: transactionDto, client: clientDto } = request;

      // Pure calculation - no database operations
      const result = await this.calculateFeePure(transactionDto, clientDto);

      return {
        success: true,
        amount: Number(result.transaction.amount),
        fee: result.fee,
      };
    } catch (error: any) {
      this.handleSingleRequestError(error, globalIndex, errors);
      return { success: false, amount: 0, fee: 0 };
    }
  }

  private async processSingleRequest(
    request: CalculateFeeDto,
    globalIndex: number,
    transactionCreator: (dto: CreateTransactionDto) => Promise<Transaction>,
    errors: string[],
  ): Promise<{ success: boolean; amount: number; fee: number }> {
    try {
      const { transaction: transactionDto, client: clientDto } = request;

      // Create client and transaction
      const client = await this.clientsService.create(clientDto);
      transactionDto.clientId = client.id;
      const transaction = await transactionCreator(transactionDto);

      // Calculate fee
      const result = await this.calculateFee(transaction, client);

      return {
        success: true,
        amount: Number(result.transaction.amount),
        fee: result.fee,
      };
    } catch (error: any) {
      this.handleSingleRequestError(error, globalIndex, errors);
      return { success: false, amount: 0, fee: 0 };
    }
  }

  private handleSingleRequestError(
    error: any,
    index: number,
    errors: string[],
  ): void {
    const errorMsg = `Batch item ${index}: ${error.message}`;
    this.logger.error(errorMsg);

    if (errors.length < this.MAX_ERRORS_TO_STORE) {
      errors.push(errorMsg);
    }
  }

  private updateMetricsFromChunkResults(
    chunkResults: Array<{ success: boolean; amount: number; fee: number }>,
    metrics: any,
  ): void {
    chunkResults.forEach((result) => {
      if (result.success) {
        metrics.processedCount++;
        metrics.totalAmount += result.amount;
        metrics.totalFee += result.fee;
      } else {
        metrics.failedCount++;
      }
    });
  }

  private logChunkProgress(
    totalRequests: number,
    currentIndex: number,
    chunkSize: number,
    chunkStartTime: number,
  ): void {
    if (totalRequests > this.PROGRESS_LOG_THRESHOLD) {
      const processed = Math.min(currentIndex + chunkSize, totalRequests);
      const chunkTime = Date.now() - chunkStartTime;
      const throughput = ((chunkSize / chunkTime) * 1000).toFixed(0);

      this.logger.log(
        `Processed ${processed}/${totalRequests} transactions ` +
          `(chunk: ${chunkTime}ms, throughput: ${throughput} tx/sec)`,
      );
    }
  }

  private async applyBackpressureIfNeeded(
    totalRequests: number,
    currentIndex: number,
    chunkSize: number,
  ): Promise<void> {
    if (totalRequests > this.LARGE_BATCH_THRESHOLD && currentIndex % (chunkSize * 5) === 0) {
      await new Promise((resolve) => setTimeout(resolve, this.BACKPRESSURE_DELAY_MS));
    }
  }

  private buildBatchResult(
    metrics: any,
    startTime: number,
    totalRequests: number,
  ): BatchCalculationResult {
    const totalTime = Date.now() - startTime;
    const averageProcessingTime = totalTime / totalRequests;
    const successRate = (metrics.processedCount / totalRequests) * 100;
    const throughput = ((totalRequests / totalTime) * 1000).toFixed(0);

    this.logger.log(
      `Batch calculation completed: ${metrics.processedCount}/${totalRequests} transactions processed ` +
        `in ${totalTime}ms (${successRate.toFixed(1)}% success rate, ${throughput} tx/sec)`,
    );

    const batchResult: BatchCalculationResult = {
      processedTransactions: metrics.processedCount,
      failedTransactions: metrics.failedCount,
      totalAmount: Math.round(metrics.totalAmount * 100) / 100,
      totalFee: Math.round(metrics.totalFee * 100) / 100,
      totalTime,
      averageProcessingTime: Math.round(averageProcessingTime * 100) / 100,
      successRate: Math.round(successRate * 100) / 100,
      ...(metrics.errors.length > 0 && { errors: metrics.errors }),
    };

    // Record batch calculation in history (async, don't wait)
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    this.historyService
      .recordBatchCalculation(batchResult, batchId)
      .catch((error) => {
        this.logger.error(
          `Failed to record batch calculation history: ${error.message}`,
        );
      });

    return batchResult;
  }

  private validateInputs(transaction: Transaction, client: Client): void {
    if (!transaction) {
      throw new Error('Transaction is required');
    }
    if (!client) {
      throw new Error('Client is required');
    }
    if (!transaction.type) {
      throw new Error('Transaction type is required');
    }
    if (typeof transaction.amount !== 'number' || transaction.amount <= 0) {
      throw new Error('Transaction amount must be a positive number');
    }
    if (typeof client.creditScore !== 'number') {
      throw new Error('Client credit score is required');
    }
  }

  // Method to reload rules (for admin operations)
  async reloadRules(): Promise<void> {
    await this.ruleService.loadRules();
    this.logger.log('Rules reloaded successfully');
  }

  // Method to get current rules info (for monitoring)
  getRulesInfo(): { count: number; lastUpdate: Date | null } {
    return {
      count: (this.ruleService.getEngine() as any).rules?.length || 0,
      lastUpdate: this.ruleService.getLastUpdate(),
    };
  }
}
