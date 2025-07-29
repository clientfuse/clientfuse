import { ApiEnv } from '@connectly/models';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventBusModule } from './core/modules/event-bus/event-bus.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt.guard';
import { AgenciesModule } from './modules/agencies/agencies.module';
import { GoogleModule } from './modules/google/google.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get(ApiEnv.MONGODB_URI),
        dbName: configService.get(ApiEnv.MONGODB_DBNAME)
      }),
      inject: [ConfigService]
    }),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    EventBusModule,
    AuthModule,
    UsersModule,
    AgenciesModule,
    GoogleModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard
    }
  ]
})
export class AppModule {
}
