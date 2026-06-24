import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common'
import { ExpensesService } from './expenses.service'
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator'
import { CreateExpenseDto } from './dto/create-expense.dto'

@Controller()
export class ExpensesController {
  constructor(private readonly expenses: ExpensesService) {}

  @Get('trips/:id/expenses')
  list(@CurrentUser() u: AuthUser, @Param('id') tripId: string) {
    return this.expenses.list(u.id, tripId)
  }

  @Get('expenses/:id')
  getOne(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.expenses.getOne(u.id, id)
  }

  @Post('trips/:id/expenses')
  create(
    @CurrentUser() u: AuthUser,
    @Param('id') tripId: string,
    @Body() dto: CreateExpenseDto,
    @Headers('idempotency-key') idemKey?: string,
  ) {
    return this.expenses.create(u.id, tripId, dto, idemKey)
  }

  @Post('expenses/:id/settle')
  settle(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.expenses.settle(u.id, id)
  }
}
