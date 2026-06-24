import { CanActivate, ExecutionContext, Injectable, BadRequestException } from '@nestjs/common'
import { MembershipService } from '../membership.service'

/**
 * Проверяет, что текущий пользователь — участник поездки из параметра роута
 * (:tripId или :id). Для вложенных ресурсов (activity/expense) членство
 * проверяется в сервисе после резолва родительской поездки.
 */
@Injectable()
export class TripMemberGuard implements CanActivate {
  constructor(private readonly membership: MembershipService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest()
    const tripId = req.params.tripId ?? req.params.id
    if (!tripId) throw new BadRequestException('Не указан id поездки')
    req.membership = await this.membership.assertMember(req.user.id, tripId)
    return true
  }
}
