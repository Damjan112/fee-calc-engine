import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';

import { FeeCalculationService } from './fee-calculation.service';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
    private readonly feeCalculationService: FeeCalculationService,
  ) {}

  async create(input: CreateTransactionDto): Promise<Transaction> {
    const transaction = this.transactionsRepository.create(input);
    return this.transactionsRepository.save(transaction);
  }

  async findAll(): Promise<Transaction[]> {
    return this.transactionsRepository.find({ relations: ['client'] });
  }

  async findById(id: string): Promise<Transaction | null> {
    return this.transactionsRepository.findOne({
      where: { id },
      relations: ['client'],
    });
  }

  async update(
    id: string,
    input: CreateTransactionDto,
  ): Promise<Transaction | null> {
    const transaction = await this.findById(id);
    if (!transaction) {
      return null;
    }
    return this.transactionsRepository.save({ ...transaction, ...input });
  }
  async delete(id: string): Promise<void> {
    await this.transactionsRepository.delete(id);
  }

  // Method to reload rules (for admin operations)
  async reloadRules(): Promise<void> {
    return await this.feeCalculationService.reloadRules();
  }

  // Method to get current rules info (for monitoring)
  getRulesInfo(): { count: number; lastUpdate: Date | null } {
    return this.feeCalculationService.getRulesInfo();
  }
}
