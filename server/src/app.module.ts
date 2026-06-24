import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { APP_GUARD } from '@nestjs/core'

import { entities } from './entities'
import { JwtAuthGuard } from './common/guards/jwt-auth.guard'
import { AccessModule } from './common/access.module'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { TripsModule } from './trips/trips.module'
import { ActivitiesModule } from './activities/activities.module'
import { ExpensesModule } from './expenses/expenses.module'
import { MemoriesModule } from './memories/memories.module'
import { NotificationsModule } from './notifications/notifications.module'
import { SummaryModule } from './summary/summary.module'
import { ReceiptsModule } from './receipts/receipts.module'
import { BingoModule } from './bingo/bingo.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'postgres',
        url: cfg.get<string>('DATABASE_URL'),
        entities,
        synchronize: cfg.get('DB_SYNCHRONIZE') === 'true',
      }),
    }),
    AccessModule,
    AuthModule,
    UsersModule,
    TripsModule,
    ActivitiesModule,
    ExpensesModule,
    MemoriesModule,
    NotificationsModule,
    SummaryModule,
    ReceiptsModule,
    BingoModule,
  ],
  providers: [
    // глобальный JWT-guard; публичные роуты помечаются @Public()
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
