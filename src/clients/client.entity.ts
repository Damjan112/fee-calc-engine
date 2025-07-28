import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Transaction } from '../transactions/transaction.entity';
import { ClientSegment } from '../common/enums';

@Entity()
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  creditScore: number;

  @Column({
    type: 'enum',
    enum: ClientSegment,
    nullable: true,
  })
  segment: ClientSegment;

  @Column({ nullable: true })
  email: string;

  @OneToMany(() => Transaction, (transaction) => transaction.client)
  transactions: Transaction[];
}
