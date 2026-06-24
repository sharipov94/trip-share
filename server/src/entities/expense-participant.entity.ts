import { Column, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm'

export type SettlementStatus = 'pending' | 'settled'

@Entity('expense_participants')
@Unique(['expenseId', 'userId'])
export class ExpenseParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid' })
  expenseId: string

  @Index()
  @Column({ type: 'uuid' })
  userId: string

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  amount: string

  @Column({ type: 'varchar', length: 16, default: 'pending' })
  status: SettlementStatus

  @Column({ type: 'timestamptz', nullable: true })
  settledAt: Date | null
}
