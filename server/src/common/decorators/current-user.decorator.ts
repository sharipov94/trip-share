import { createParamDecorator, ExecutionContext } from '@nestjs/common'

export interface AuthUser {
  id: string
  telegramId: string
}

/** Достаёт текущего пользователя (положен JwtAuthGuard в request.user). */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    return ctx.switchToHttp().getRequest().user
  },
)
