import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'

async function bootstrap() {
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
