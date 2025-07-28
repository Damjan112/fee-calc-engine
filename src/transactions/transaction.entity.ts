import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Client } from '../clients/client.entity';
import { TransactionType, Currency } from '../common/enums';

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type: TransactionType;

  @Column('decimal', { precision: 12, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: Currency,
    default: Currency.EUR,
  })
  currency: Currency;

  @ManyToOne(() => Client, (client) => client.transactions, { eager: true })
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @Column()
  clientId: string;

  @CreateDateColumn()
  createdAt: Date;
}
