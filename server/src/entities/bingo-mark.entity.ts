import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm'

@Entity('bingo_marks')
@Unique(['tripId', 'taskKey'])
export class BingoMark {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid' })
  tripId: string

  @Column({ type: 'varchar', length: 32 })
  taskKey: string

  @Column({ type: 'uuid', nullable: true })
  userId: string | null

  @Column({ type: 'text', nullable: true })
  photoUrl: string | null

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date
}
