import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

export type TripType = 'flight' | 'car' | 'train' | 'bus' | 'other'
export type TripStatus = 'planning' | 'active' | 'finished'

@Entity('trips')
export class Trip {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 255 })
  title: string

  @Column({ type: 'text', nullable: true })
  description: string | null

  @Column({ type: 'varchar', length: 16, nullable: true })
  tripType: TripType | null

  @Column({ type: 'varchar', length: 16, default: 'planning' })
  status: TripStatus

  @Column({ type: 'char', length: 3 })
  baseCurrency: string

  @Column({ type: 'date', nullable: true })
  startDate: string | null

  @Column({ type: 'date', nullable: true })
  endDate: string | null

  @Index()
  @Column({ type: 'uuid' })
  ownerId: string

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date
}
