import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm'

export type ExpenseCategory =
  | 'activity' | 'restaurant' | 'transport' | 'fuel' | 'parking' | 'toll'
  | 'accommodation' | 'shopping' | 'other'
export type SplitMode = 'equal' | 'passengers_only' | 'manual'

@Entity('expenses')
@Index(['tripId', 'createdAt'])
@Unique(['payerId', 'idempotencyKey'])
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid' })
  tripId: string

  @Column({ type: 'uuid', nullable: true })
  activityId: string | null

  @Column({ type: 'uuid' })
  payerId: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string | null

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  amount: string

  @Column({ type: 'char', length: 3 })
  currency: string

  @Column({ type: 'numeric', precision: 18, scale: 8, nullable: true })
  exchangeRate: string | null

  @Column({ type: 'varchar', length: 24, nullable: true })
  category: ExpenseCategory | null

  @Column({ type: 'varchar', length: 16, default: 'equal' })
  splitMode: SplitMode

  @Column({ type: 'varchar', length: 128, nullable: true })
  idempotencyKey: string | null

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date
}
