import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Put,
  Delete,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { CalculateFeeDto } from './dto/calculate-fee.dto';
import { BatchCalculateFeeDto } from './dto/batch-calculate-fee.dto';
import { ClientsService } from '../clients/clients.service';
import { FeeCalculationResult } from './interfaces/fee-calculation-result.interface';
import { BatchCalculationResult } from './interfaces/batch-calculation-result.interface';
import { FeeCalculationService } from './fee-calculation.service';

@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly clientsService: ClientsService,
    private readonly feeCalculationService: FeeCalculationService,
  ) {}

  @Post()
  async create(@Body() dto: CreateTransactionDto) {
    return this.transactionsService.create(dto);
  }

  @Post('calculate-fee-pure')
  async calculateFeePure(
    @Body() calculateFeeDto: CalculateFeeDto,
  ): Promise<FeeCalculationResult> {
    const { transaction: transactionDto, client: clientDto } = calculateFeeDto;

    // Pure calculation - no database persistence
    return await this.feeCalculationService.calculateFeePure(
      transactionDto,
      clientDto,
    );
  }

  @Post('calculate-fee')
  async calculateFee(
    @Body() calculateFeeDto: CalculateFeeDto,
  ): Promise<FeeCalculationResult> {
    const { transaction: transactionDto, client: clientDto } = calculateFeeDto;

    // Create client first
    const client = await this.clientsService.create(clientDto);

    // Set clientId in transaction and create transaction
    transactionDto.clientId = client.id;
    const transaction = await this.transactionsService.create(transactionDto);

    return await this.feeCalculationService.calculateFee(transaction, client);
  }

  @Get()
  async findAll() {
    return this.transactionsService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.transactionsService.findById(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: CreateTransactionDto) {
    return this.transactionsService.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.transactionsService.delete(id);
  }

  @Post('batch-calculate-fee-pure')
  async batchCalculateFeePure(
    @Body() batchDto: BatchCalculateFeeDto,
  ): Promise<BatchCalculationResult> {
    return await this.feeCalculationService.batchCalculateFeePure(
      batchDto.transactions,
    );
  }

  @Post('batch-calculate-fee')
  async batchCalculateFee(
    @Body() batchDto: BatchCalculateFeeDto,
  ): Promise<BatchCalculationResult> {
    return await this.feeCalculationService.batchCalculateFee(
      batchDto.transactions,
      (dto) => this.transactionsService.create(dto),
    );
  }
}
