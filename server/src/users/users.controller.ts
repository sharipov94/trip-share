import { Body, Controller, Get, Param, Patch } from '@nestjs/common'
import { UsersService } from './users.service'
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator'
import { UpdateMeDto } from './dto/update-me.dto'

@Controller()
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('users/me')
  me(@CurrentUser() user: AuthUser) {
    return this.users.selfView(user.id)
  }

  @Patch('users/me')
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateMeDto) {
    return this.users.updateMe(user.id, dto)
  }

  @Get('users/:id')
  publicProfile(@Param('id') id: string) {
    return this.users.publicView(id)
  }
}
