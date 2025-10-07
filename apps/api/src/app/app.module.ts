import { ApiEnv } from '@clientfuse/models';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AxiosRetryModule } from 'nestjs-axios-retry';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventBusModule } from './core/modules/event-bus/event-bus.module';
import { AwsModule } from './core/services/aws/aws.module';
import { createRetryConfig } from './core/utils/http';
import { AgenciesModule } from './modules/agencies/agencies.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt.guard';
import { ConnectionLinkModule } from './modules/connection-link/connection-link.module';
import { ConnectionResultModule } from './modules/connection-result/connection-result.module';
import { FacebookModule } from './modules/facebook/facebook.module';
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
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5
    }),
    AxiosRetryModule.forRoot({ axiosRetryConfig: createRetryConfig() }),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    EventBusModule,
    AwsModule,
    AuthModule,
    UsersModule,
    AgenciesModule,
    ConnectionLinkModule,
    ConnectionResultModule,
    GoogleModule,
    FacebookModule
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
