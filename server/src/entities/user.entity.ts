import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'bigint', unique: true })
  telegramId: string

  @Column({ type: 'varchar', length: 64, nullable: true })
  username: string | null

  @Column({ type: 'varchar', length: 128, nullable: true })
  firstName: string | null

  @Column({ type: 'text', nullable: true })
  avatarUrl: string | null

  @Column({ type: 'text', nullable: true })
  paymentDetails: string | null

  @Column({ type: 'varchar', length: 16, default: 'sunset' })
  theme: string

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date
}
