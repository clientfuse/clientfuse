import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { GoogleAccessController } from './google-access.controller';
import { GoogleController } from './google.controller';
import { GoogleAdsAccessService } from './services/access/google-ads-access.service';
import { GoogleAnalyticsAccessService } from './services/access/google-analytics-access.service';
import { GoogleMerchantCenterAccessService } from './services/access/google-merchant-center-access.service';
import { GoogleMyBusinessAccessService } from './services/access/google-my-business-access.service';
import { GoogleSearchConsoleAccessService } from './services/access/google-search-console-access.service';
import { GoogleTagManagerAccessService } from './services/access/google-tag-manager-access.service';
import { GoogleListenerService } from './services/google-listener.service';
import { GoogleSchedulerService } from './services/google-scheduler.service';

@Module({
  providers: [
    GoogleSchedulerService,
    GoogleListenerService,
    GoogleAdsAccessService,
    GoogleAnalyticsAccessService,
    GoogleMerchantCenterAccessService,
    GoogleMyBusinessAccessService,
    GoogleSearchConsoleAccessService,
    GoogleTagManagerAccessService
  ],
  imports: [UsersModule],
  controllers: [GoogleController, GoogleAccessController]
})
export class GoogleModule {
}
