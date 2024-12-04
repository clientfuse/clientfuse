import { ApiEnv } from '@connectly/models';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
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
    AuthModule,
    UsersModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {
}
