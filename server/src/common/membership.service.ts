import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { MemberRole, TripMember } from '../entities/trip-member.entity'

/**
 * Object-level авторизация (см. docs/06-access-control.md, docs/09-security.md).
 * Любой доступ к ресурсам поездки проходит через проверку членства.
 */
@Injectable()
export class MembershipService {
  constructor(
    @InjectRepository(TripMember) private readonly members: Repository<TripMember>,
  ) {}

  getMembership(userId: string, tripId: string) {
    return this.members.findOne({ where: { tripId, userId } })
  }

  /** Бросает 404, если пользователь не участник (не раскрываем существование ресурса). */
  async assertMember(userId: string, tripId: string): Promise<TripMember> {
    const m = await this.getMembership(userId, tripId)
    if (!m) throw new NotFoundException('Поездка не найдена')
    return m
  }

  /** Требует одну из ролей (например owner/admin). */
  async assertRole(userId: string, tripId: string, roles: MemberRole[]): Promise<TripMember> {
    const m = await this.assertMember(userId, tripId)
    if (!roles.includes(m.role)) throw new ForbiddenException('Недостаточно прав')
    return m
  }
}
