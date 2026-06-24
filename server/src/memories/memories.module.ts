import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Memory } from '../entities/memory.entity'
import { Activity } from '../entities/activity.entity'
import { MemoriesService } from './memories.service'
import { MemoriesController } from './memories.controller'

@Module({
  imports: [TypeOrmModule.forFeature([Memory, Activity])],
  providers: [MemoriesService],
  controllers: [MemoriesController],
})
export class MemoriesModule {}
