import { Controller, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { ReceiptsService } from './receipts.service'
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator'

@Controller()
export class ReceiptsController {
  constructor(private readonly receipts: ReceiptsService) {}

  @Post('trips/:id/receipt-ocr')
  @UseInterceptors(
    FileInterceptor('photo', { storage: memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } }),
  )
  ocr(@CurrentUser() u: AuthUser, @Param('id') tripId: string, @UploadedFile() file: Express.Multer.File) {
    return this.receipts.ocr(u.id, tripId, file)
  }
}
