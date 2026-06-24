import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm'

export type VoteValue = 'going' | 'not_going'

@Entity('activity_votes')
@Unique(['activityId', 'userId'])
export class ActivityVote {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid' })
  activityId: string

  @Column({ type: 'uuid' })
  userId: string

  @Column({ type: 'varchar', length: 16 })
  vote: VoteValue

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date
}
