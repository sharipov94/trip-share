import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Trip } from '../entities/trip.entity'
import { TripMember } from '../entities/trip-member.entity'
import { TripsService } from './trips.service'
import { TripsController } from './trips.controller'
import { ExpensesModule } from '../expenses/expenses.module'
import { NotificationsModule } from '../notifications/notifications.module'

@Module({
  imports: [TypeOrmModule.forFeature([Trip, TripMember]), ExpensesModule, NotificationsModule],
  providers: [TripsService],
  controllers: [TripsController],
})
export class TripsModule {}
