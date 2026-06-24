import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

@Entity('activity_comments')
export class ActivityComment {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Index()
  @Column({ type: 'uuid' })
  activityId: string

  @Column({ type: 'uuid', nullable: true })
  userId: string | null

  @Column({ type: 'text' })
  body: string

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date
}
