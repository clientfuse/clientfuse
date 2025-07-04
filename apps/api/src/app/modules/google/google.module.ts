import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { GoogleListenerService } from './google-listener.service';
import { GoogleSchedulerService } from './google-scheduler.service';
import { GoogleController } from './google.controller';

@Module({
  providers: [GoogleSchedulerService, GoogleListenerService],
  imports: [UsersModule],
  controllers: [GoogleController]
})
export class GoogleModule {
}
