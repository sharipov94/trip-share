import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'

/**
 * Не даём подняться с дефолтными/слабыми секретами в production.
 * Вне production — только предупреждаем, чтобы локальная разработка не ломалась.
 */
function assertSecrets() {
  const isProd = process.env.NODE_ENV === 'production'
  const jwt = process.env.JWT_SECRET ?? ''
  const weakJwt = jwt.length < 32 || /change-?me|secret|password|example/i.test(jwt)
  const encHex = process.env.ENCRYPTION_KEY ?? ''
  const badEnc = Buffer.from(encHex, 'hex').length !== 32

  const problems: string[] = []
  if (weakJwt) problems.push('JWT_SECRET слабый/не задан (нужно 32+ случайных символа)')
  if (badEnc) problems.push('ENCRYPTION_KEY должен быть 32 байта (64 hex)')
  if (!problems.length) return

  const msg = `[security] ${problems.join('; ')}`
  if (isProd) throw new Error(msg)
  console.warn(`${msg} — допустимо для dev, ОБЯЗАТЕЛЬНО задать в production`)
}

async function bootstrap() {
  assertSecrets()
  const app = await NestFactory.create(AppModule)
  app.setGlobalPrefix('api/v1')
  app.enableCors({ origin: true, credentials: true })
  // whitelist + forbidNonWhitelisted — защита от mass assignment (см. docs/09-security.md)
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  )
  const port = process.env.PORT ? Number(process.env.PORT) : 3000
  await app.listen(port)
  console.log(`TravelMate API → http://localhost:${port}/api/v1`)
}
bootstrap()
