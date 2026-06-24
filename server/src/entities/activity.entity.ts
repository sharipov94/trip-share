import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

export type ActivityStatus = 'proposed' | 'confirmed' | 'completed' | 'cancelled'

@Entity('activities')
@Index(['tripId', 'startTime'])
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid' })
  tripId: string

  @Column({ type: 'uuid', nullable: true })
  creatorId: string | null

  @Column({ type: 'varchar', length: 255 })
  title: string

  @Column({ type: 'text', nullable: true })
  description: string | null

  @Column({ type: 'text', nullable: true })
  activityUrl: string | null

  @Column({ type: 'numeric', precision: 14, scale: 2, nullable: true })
  price: string | null

  @Column({ type: 'char', length: 3, nullable: true })
  currency: string | null

  @Column({ type: 'timestamptz', nullable: true })
  startTime: Date | null

  @Column({ type: 'timestamptz', nullable: true })
  endTime: Date | null

  @Column({ type: 'varchar', length: 16, default: 'proposed' })
  status: ActivityStatus

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date
}
