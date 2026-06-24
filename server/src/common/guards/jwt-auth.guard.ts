import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'
import { IS_PUBLIC_KEY } from '../decorators/public.decorator'

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(ctx: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ])
    if (isPublic) return true

    const req = ctx.switchToHttp().getRequest()
    const auth: string | undefined = req.headers['authorization']
    if (!auth?.startsWith('Bearer ')) throw new UnauthorizedException('Нет токена')

    try {
      const payload = this.jwt.verify(auth.slice(7), { secret: process.env.JWT_SECRET })
      req.user = { id: payload.sub, telegramId: payload.tg }
      return true
    } catch {
      throw new UnauthorizedException('Невалидный токен')
    }
  }
}
