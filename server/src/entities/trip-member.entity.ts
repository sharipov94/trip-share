import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm'

export type MemberRole = 'owner' | 'admin' | 'member'

@Entity('trip_members')
@Unique(['tripId', 'userId'])
export class TripMember {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid' })
  tripId: string

  @Index()
  @Column({ type: 'uuid' })
  userId: string

  @Column({ type: 'varchar', length: 16, default: 'member' })
  role: MemberRole

  @CreateDateColumn({ type: 'timestamptz' })
  joinedAt: Date
}
