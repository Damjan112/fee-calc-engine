import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { FeeCalculationHistory } from './history.entity';
import { HistoryQueryDto } from './dto/history-query.dto';
import { HistoryStatsDto } from './dto/history-stats.dto';
import { FeeCalculationResult } from '../transactions/interfaces/fee-calculation-result.interface';
import { BatchCalculationResult } from '../transactions/interfaces/batch-calculation-result.interface';
import { Currency, CalculationType } from '../common/enums';

@Injectable()
export class HistoryService {
  private readonly logger = new Logger(HistoryService.name);

  constructor(
    @InjectRepository(FeeCalculationHistory)
    private historyRepository: Repository<FeeCalculationHistory>,
  ) {}

  async recordSingleCalculation(
    result: FeeCalculationResult,
  ): Promise<FeeCalculationHistory> {
    try {
      const historyRecord = this.historyRepository.create({
        transactionId: result.transaction.id,
        clientId: result.client.id,
        transactionType: result.transaction.type,
        transactionAmount: Number(result.transaction.amount),
        currency: result.transaction.currency || Currency.EUR,
        calculatedFee: result.fee,
        totalAmount: result.totalAmount,
        rulesAppliedCount: result.appliedRules.length,
        appliedRules: result.appliedRules,
        calculationTimeMs: result.calculationTime,
        clientData: {
          name: result.client.name,
          creditScore: result.client.creditScore,
          segment: result.client.segment,
        },
        transactionData: {
          type: result.transaction.type,
          amount: result.transaction.amount,
          currency: result.transaction.currency,
          createdAt: result.transaction.createdAt,
        },
        errors: result.errors || [],
        calculationType: CalculationType.SINGLE,
      });

      const saved = await this.historyRepository.save(historyRecord);
      this.logger.debug(
        `Recorded calculation history for transaction ${result.transaction.id}`,
      );
      return saved;
    } catch (error: any) {
      this.logger.error(
        `Failed to record calculation history: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async recordBatchCalculation(
    result: BatchCalculationResult,
    batchId: string,
  ): Promise<FeeCalculationHistory> {
    try {
      const historyRecord = this.historyRepository.create({
        transactionAmount: result.totalAmount,
        currency: Currency.EUR,
        calculatedFee: result.totalFee,
        totalAmount: result.totalAmount + result.totalFee,
        rulesAppliedCount: 0, // Batch doesn't track individual rules
        appliedRules: [],
        calculationTimeMs: result.totalTime,
        clientData: {
          batchSize: result.processedTransactions + result.failedTransactions,
          processedCount: result.processedTransactions,
          failedCount: result.failedTransactions,
        },
        transactionData: {
          processedTransactions: result.processedTransactions,
          failedTransactions: result.failedTransactions,
          successRate: result.successRate,
          averageProcessingTime: result.averageProcessingTime,
        },
        errors: result.errors || [],
        calculationType: CalculationType.BATCH,
        batchId,
      });

      const saved = await this.historyRepository.save(historyRecord);
      this.logger.debug(
        `Recorded batch calculation history for batch ${batchId}`,
      );
      return saved;
    } catch (error: any) {
      this.logger.error(
        `Failed to record batch calculation history: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getHistory(query: HistoryQueryDto): Promise<{
    data: FeeCalculationHistory[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const queryBuilder = this.historyRepository.createQueryBuilder('history');

    // Apply filters
    if (query.transactionType) {
      queryBuilder.andWhere('history.transactionType = :transactionType', {
        transactionType: query.transactionType,
      });
    }

    if (query.clientId) {
      queryBuilder.andWhere('history.clientId = :clientId', {
        clientId: query.clientId,
      });
    }

    if (query.transactionId) {
      queryBuilder.andWhere('history.transactionId = :transactionId', {
        transactionId: query.transactionId,
      });
    }

    if (query.calculationType) {
      queryBuilder.andWhere('history.calculationType = :calculationType', {
        calculationType: query.calculationType,
      });
    }

    if (query.batchId) {
      queryBuilder.andWhere('history.batchId = :batchId', {
        batchId: query.batchId,
      });
    }

    if (query.startDate && query.endDate) {
      queryBuilder.andWhere(
        'history.calculatedAt BETWEEN :startDate AND :endDate',
        {
          startDate: query.startDate,
          endDate: query.endDate,
        },
      );
    }

    // Apply sorting
    queryBuilder.orderBy(`history.${query.sortBy}`, query.sortOrder);

    // Apply pagination
    const total = await queryBuilder.getCount();
    const data = await queryBuilder
      .skip(query.offset)
      .take(query.limit)
      .getMany();

    const totalPages = Math.ceil(total / query.limit!);
    const page = Math.floor(query.offset! / query.limit!) + 1;

    return {
      data,
      total,
      page,
      totalPages,
    };
  }

  async getHistoryStats(
    startDate?: string,
    endDate?: string,
  ): Promise<HistoryStatsDto> {
    const queryBuilder = this.historyRepository.createQueryBuilder('history');

    if (startDate && endDate) {
      queryBuilder.where(
        'history.calculatedAt BETWEEN :startDate AND :endDate',
        {
          startDate,
          endDate,
        },
      );
    }

    const [
      totalCalculations,
      aggregateStats,
      calculationsByType,
      calculationsByDay,
      topRules,
    ] = await Promise.all([
      queryBuilder.getCount(),
      this.getAggregateStats(queryBuilder),
      this.getCalculationsByType(startDate, endDate),
      this.getCalculationsByDay(startDate, endDate),
      this.getTopRulesApplied(startDate, endDate),
    ]);

    return {
      totalCalculations,
      totalTransactionAmount: aggregateStats.totalTransactionAmount || 0,
      totalFeesCalculated: aggregateStats.totalFeesCalculated || 0,
      averageFee: aggregateStats.averageFee || 0,
      averageCalculationTime: aggregateStats.averageCalculationTime || 0,
      successRate: await this.calculateSuccessRate(queryBuilder),
      calculationsByType,
      calculationsByDay,
      topRulesApplied: topRules,
    };
  }

  private async getAggregateStats(queryBuilder: any) {
    const result = await queryBuilder
      .select([
        'SUM(history.transactionAmount) as totalTransactionAmount',
        'SUM(history.calculatedFee) as totalFeesCalculated',
        'AVG(history.calculatedFee) as averageFee',
        'AVG(history.calculationTimeMs) as averageCalculationTime',
      ])
      .getRawOne();

    return {
      totalTransactionAmount: parseFloat(result.totalTransactionAmount) || 0,
      totalFeesCalculated: parseFloat(result.totalFeesCalculated) || 0,
      averageFee: parseFloat(result.averageFee) || 0,
      averageCalculationTime: parseFloat(result.averageCalculationTime) || 0,
    };
  }

  private async getCalculationsByType(
    startDate?: string,
    endDate?: string,
  ): Promise<Record<string, number>> {
    // Create a fresh query builder to avoid conflicts
    const freshQueryBuilder =
      this.historyRepository.createQueryBuilder('history');

    // Apply date filter if provided
    if (startDate && endDate) {
      freshQueryBuilder.where(
        'history.calculatedAt BETWEEN :startDate AND :endDate',
        { startDate, endDate },
      );
    }

    const results = await freshQueryBuilder
      .select(['history.transactionType', 'COUNT(*) as count'])
      .groupBy('history.transactionType')
      .getRawMany();

    return results.reduce((acc: Record<string, number>, row: any) => {
      acc[row.history_transactionType] = parseInt(row.count);
      return acc;
    }, {});
  }

  private async getCalculationsByDay(startDate?: string, endDate?: string) {
    // Create a fresh query builder to avoid conflicts
    const freshQueryBuilder =
      this.historyRepository.createQueryBuilder('history');

    // Apply date filter if provided
    if (startDate && endDate) {
      freshQueryBuilder.where(
        'history.calculatedAt BETWEEN :startDate AND :endDate',
        { startDate, endDate },
      );
    }

    const results = await freshQueryBuilder
      .select([
        'DATE(history.calculatedAt) as date',
        'COUNT(*) as count',
        'SUM(history.calculatedFee) as totalFees',
      ])
      .groupBy('DATE(history.calculatedAt)')
      .orderBy('DATE(history.calculatedAt)', 'DESC')
      .limit(30)
      .getRawMany();

    return results.map((row: any) => ({
      date: row.date,
      count: parseInt(row.count),
      totalFees: parseFloat(row.totalFees) || 0,
    }));
  }

  private async getTopRulesApplied(startDate?: string, endDate?: string) {
    // This is a simplified version - in production you'd want more sophisticated rule analysis
    // Create a fresh query builder to avoid GROUP BY conflicts
    const freshQueryBuilder =
      this.historyRepository.createQueryBuilder('history');

    // Apply date filter and calculation type filter
    freshQueryBuilder.where('history.calculationType = :type', {
      type: 'SINGLE',
    });

    if (startDate && endDate) {
      freshQueryBuilder.andWhere(
        'history.calculatedAt BETWEEN :startDate AND :endDate',
        { startDate, endDate },
      );
    }

    const results = await freshQueryBuilder
      .select(['history.appliedRules'])
      .getMany();

    const ruleStats: Record<string, { count: number; totalFeeImpact: number }> =
      {};

    results.forEach((record: FeeCalculationHistory) => {
      if (record.appliedRules && Array.isArray(record.appliedRules)) {
        record.appliedRules.forEach((rule: any) => {
          const key = rule.description || 'Unknown Rule';
          if (!ruleStats[key]) {
            ruleStats[key] = { count: 0, totalFeeImpact: 0 };
          }
          ruleStats[key].count++;
          ruleStats[key].totalFeeImpact += rule.fee || 0;
        });
      }
    });

    return Object.entries(ruleStats)
      .map(([description, stats]) => ({
        ruleDescription: description,
        count: stats.count,
        totalFeeImpact: Math.round(stats.totalFeeImpact * 100) / 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private async calculateSuccessRate(queryBuilder: any): Promise<number> {
    const total = await queryBuilder.getCount();
    if (total === 0) return 100;

    const failed = await queryBuilder
      .andWhere('JSON_LENGTH(history.errors) > 0')
      .getCount();

    return Math.round(((total - failed) / total) * 100 * 100) / 100;
  }

  async deleteOldHistory(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.historyRepository.delete({
      calculatedAt: Between(new Date('1970-01-01'), cutoffDate),
    });

    this.logger.log(`Deleted ${result.affected || 0} old history records`);
    return result.affected || 0;
  }
}
