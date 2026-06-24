import { Controller, Get, Param } from '@nestjs/common'
import { SummaryService } from './summary.service'
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator'

@Controller()
export class SummaryController {
  constructor(private readonly summary: SummaryService) {}

  @Get('trips/:id/summary')
  forTrip(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.summary.forTrip(u.id, id)
  }
}
