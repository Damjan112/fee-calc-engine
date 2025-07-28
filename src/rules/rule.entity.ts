import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { RuleTransactionType } from '../common/enums';

@Entity()
@Index(['type', 'isActive']) // Index for efficient rule filtering
export class FeeRule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: RuleTransactionType,
  })
  type: RuleTransactionType;

  @Column('json')
  conditions: any; // JSON rules engine conditions

  @Column('json')
  event: any; // JSON rules engine event/calculation

  @Column()
  priority: number; // Lower number = higher priority

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
