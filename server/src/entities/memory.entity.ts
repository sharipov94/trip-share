import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

export type MemoryPhase =
  | 'before_activity' | 'during_activity' | 'after_activity'
  | 'before_trip' | 'during_trip' | 'after_trip'

@Entity('memories')
@Index(['tripId', 'takenAt'])
export class Memory {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid' })
  tripId: string

  @Column({ type: 'uuid', nullable: true })
  activityId: string | null

  @Column({ type: 'uuid', nullable: true })
  userId: string | null

  @Column({ type: 'text' })
  photoUrl: string

  @Column({ type: 'varchar', length: 20, nullable: true })
  memoryPhase: MemoryPhase | null

  @Column({ type: 'timestamptz', nullable: true })
  takenAt: Date | null

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date
}
