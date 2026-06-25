import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Expense } from '../entities/expense.entity'
import { ExpenseParticipant } from '../entities/expense-participant.entity'
import { TripMember } from '../entities/trip-member.entity'
import { Settlement } from '../entities/settlement.entity'
import { ExpensesService } from './expenses.service'
import { ExpensesController } from './expenses.controller'
import { BalanceService } from './balance.service'

@Module({
  imports: [TypeOrmModule.forFeature([Expense, ExpenseParticipant, TripMember, Settlement])],
  providers: [ExpensesService, BalanceService],
  controllers: [ExpensesController],
  exports: [BalanceService],
})
export class ExpensesModule {}
