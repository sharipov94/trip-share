import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common'
import { TripsService } from './trips.service'
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator'
import { CreateTripDto } from './dto/create-trip.dto'
import { UpdateTripDto } from './dto/update-trip.dto'
import { BalanceService } from '../expenses/balance.service'
import { RecordSettlementDto } from '../expenses/dto/record-settlement.dto'

@Controller('trips')
export class TripsController {
  constructor(
    private readonly trips: TripsService,
    private readonly balance: BalanceService,
  ) {}

  @Post()
  create(@CurrentUser() u: AuthUser, @Body() dto: CreateTripDto) {
    return this.trips.create(u.id, dto)
  }

  @Get()
  list(@CurrentUser() u: AuthUser) {
    return this.trips.listForUser(u.id)
  }

  @Get(':id')
  getOne(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.trips.getOne(u.id, id)
  }

  @Patch(':id')
  update(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: UpdateTripDto) {
    return this.trips.update(u.id, id, dto)
  }

  @Delete(':id')
  remove(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.trips.remove(u.id, id)
  }

  @Get(':id/members')
  members(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.trips.members_(u.id, id)
  }

  @Post('join')
  join(@CurrentUser() u: AuthUser, @Body('token') token: string) {
    return this.trips.join(u.id, token)
  }

  @Post(':id/invite')
  invite(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.trips.createInvite(u.id, id)
  }

  @Get(':id/balance')
  getBalance(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.balance.computeForTrip(u.id, id)
  }

  @Post(':id/settlements')
  recordSettlement(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: RecordSettlementDto) {
    return this.balance.record(u.id, id, dto)
  }
}
