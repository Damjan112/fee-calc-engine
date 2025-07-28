import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { TransactionType, Currency, CalculationType } from '../common/enums';

@Entity('fee_calculation_history')
@Index(['calculatedAt'])
@Index(['transactionType'])
@Index(['clientId'])
export class FeeCalculationHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  transactionId: string;

  @Column({ nullable: true })
  clientId: string;

  @Column({
    type: 'enum',
    enum: TransactionType,
    nullable: true, // Nullable for batch operations which don't have a single transaction type
  })
  transactionType: TransactionType | null;

  @Column('decimal', { precision: 12, scale: 2 })
  transactionAmount: number;

  @Column({
    type: 'enum',
    enum: Currency,
    default: Currency.EUR,
  })
  currency: Currency;

  @Column('decimal', { precision: 12, scale: 2 })
  calculatedFee: number;

  @Column('decimal', { precision: 12, scale: 2 })
  totalAmount: number;

  @Column()
  rulesAppliedCount: number;

  @Column('json')
  appliedRules: any[];

  @Column()
  calculationTimeMs: number;

  @Column('json')
  clientData: any;

  @Column('json')
  transactionData: any;

  @Column('json', { nullable: true })
  errors: string[];

  @Column({
    type: 'enum',
    enum: CalculationType,
    default: CalculationType.SINGLE,
  })
  calculationType: CalculationType;

  @Column({ nullable: true })
  batchId: string;

  @CreateDateColumn()
  calculatedAt: Date;
}
