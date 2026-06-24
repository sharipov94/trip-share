import { Global, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TripMember } from '../entities/trip-member.entity'
import { MembershipService } from './membership.service'
import { TripMemberGuard } from './guards/trip-member.guard'

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([TripMember])],
  providers: [MembershipService, TripMemberGuard],
  exports: [MembershipService, TripMemberGuard],
})
export class AccessModule {}
