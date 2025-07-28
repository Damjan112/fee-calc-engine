import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './transaction.entity';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { FeeCalculationService } from './fee-calculation.service';
import { ClientsModule } from '../clients/clients.module';
import { RulesModule } from '../rules/rules.module';
import { HistoryModule } from '../history/history.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction]),
    ClientsModule,
    RulesModule,
    HistoryModule,
  ],
  providers: [TransactionsService, FeeCalculationService],
  controllers: [TransactionsController],
  exports: [TransactionsService, FeeCalculationService],
})
export class TransactionsModule {}
