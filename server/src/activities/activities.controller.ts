import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common'
import { ActivitiesService } from './activities.service'
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator'
import { CreateActivityDto, UpdateActivityDto, VoteDto, CommentDto } from './dto/create-activity.dto'

@Controller()
export class ActivitiesController {
  constructor(private readonly activities: ActivitiesService) {}

  @Get('trips/:id/activities')
  list(@CurrentUser() u: AuthUser, @Param('id') tripId: string) {
    return this.activities.list(u.id, tripId)
  }

  @Post('trips/:id/activities')
  create(@CurrentUser() u: AuthUser, @Param('id') tripId: string, @Body() dto: CreateActivityDto) {
    return this.activities.create(u.id, tripId, dto)
  }

  @Get('activities/:id')
  getOne(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.activities.getOne(u.id, id)
  }

  @Patch('activities/:id')
  update(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: UpdateActivityDto) {
    return this.activities.update(u.id, id, dto)
  }

  @Post('activities/:id/vote')
  vote(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: VoteDto) {
    return this.activities.vote(u.id, id, dto.vote)
  }

  @Post('activities/:id/complete')
  complete(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.activities.complete(u.id, id)
  }

  @Get('activities/:id/comments')
  comments(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.activities.listComments(u.id, id)
  }

  @Post('activities/:id/comments')
  addComment(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: CommentDto) {
    return this.activities.addComment(u.id, id, dto.body)
  }
}
