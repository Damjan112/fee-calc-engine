import { Client } from '../../clients/client.entity';
import { Transaction } from '../transaction.entity';
import { AppliedRule } from './applied-rule.interface';

export interface FeeCalculationResult {
  transaction: Transaction;
  client: Client;
  fee: number;
  totalAmount: number;
  appliedRules: AppliedRule[];
  calculationTime: number;
  errors?: string[];
}
