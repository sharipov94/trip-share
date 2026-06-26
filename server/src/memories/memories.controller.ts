import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { MemoriesService } from './memories.service'
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator'
import type { MemoryPhase } from '../entities/memory.entity'

@Controller()
export class MemoriesController {
  constructor(private readonly memories: MemoriesService) {}

  @Get('trips/:id/memories')
  list(@CurrentUser() u: AuthUser, @Param('id') tripId: string) {
    return this.memories.list(u.id, tripId)
  }

  @Get('memories/activity/:id')
  byActivity(@CurrentUser() u: AuthUser, @Param('id') activityId: string) {
    return this.memories.byActivity(u.id, activityId)
  }

  @Post('trips/:id/memories')
  @UseInterceptors(
    FileInterceptor('photo', { storage: memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } }),
  )
  upload(
    @CurrentUser() u: AuthUser,
    @Param('id') tripId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { phase?: MemoryPhase; activityId?: string; takenAt?: string },
  ) {
    return this.memories.create(u.id, tripId, file, body)
  }

  @Delete('memories/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.memories.remove(u.id, id)
  }
}
