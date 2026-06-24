import { Controller, Delete, Get, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { BingoService } from './bingo.service'
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator'

@Controller()
export class BingoController {
  constructor(private readonly bingo: BingoService) {}

  @Get('trips/:id/bingo')
  list(@CurrentUser() u: AuthUser, @Param('id') tripId: string) {
    return this.bingo.list(u.id, tripId)
  }

  @Post('trips/:id/bingo/:key/photo')
  @UseInterceptors(
    FileInterceptor('photo', { storage: memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } }),
  )
  upload(
    @CurrentUser() u: AuthUser,
    @Param('id') tripId: string,
    @Param('key') key: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.bingo.uploadPhoto(u.id, tripId, key, file)
  }

  @Delete('trips/:id/bingo/:key')
  remove(@CurrentUser() u: AuthUser, @Param('id') tripId: string, @Param('key') key: string) {
    return this.bingo.remove(u.id, tripId, key)
  }
}
