import { SetMetadata } from '@nestjs/common'

export const IS_PUBLIC_KEY = 'isPublic'
/** Помечает роут как публичный — JwtAuthGuard его пропускает. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)
