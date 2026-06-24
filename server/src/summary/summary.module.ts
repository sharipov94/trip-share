import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Trip } from '../entities/trip.entity'
import { TripMember } from '../entities/trip-member.entity'
import { Activity } from '../entities/activity.entity'
import { Expense } from '../entities/expense.entity'
import { Memory } from '../entities/memory.entity'
import { SummaryService } from './summary.service'
import { SummaryController } from './summary.controller'

@Module({
  imports: [TypeOrmModule.forFeature([Trip, TripMember, Activity, Expense, Memory])],
  providers: [SummaryService],
  controllers: [SummaryController],
})
export class SummaryModule {}
