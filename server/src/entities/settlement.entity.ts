import { Column, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

export type SettlementStatus = 'pending' | 'settled'

@Entity('settlements')
export class Settlement {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Index()
  @Column({ type: 'uuid' })
  tripId: string

  @Column({ type: 'uuid' })
  fromUser: string

  @Column({ type: 'uuid' })
  toUser: string

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  amount: string

  @Column({ type: 'varchar', length: 16, default: 'pending' })
  status: SettlementStatus

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date
}
