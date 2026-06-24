import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { BingoMark } from '../entities/bingo-mark.entity'
import { BingoService } from './bingo.service'
import { BingoController } from './bingo.controller'

@Module({
  imports: [TypeOrmModule.forFeature([BingoMark])],
  providers: [BingoService],
  controllers: [BingoController],
})
export class BingoModule {}
