import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { FacebookAccessController } from './facebook-access.controller';
import { FacebookController } from './facebook.controller';
import { FacebookAdAccountAccessService } from './services/access/facebook-ad-account-access.service';
import { FacebookBusinessAccessService } from './services/access/facebook-business-access.service';
import { FacebookCatalogAccessService } from './services/access/facebook-catalog-access.service';
import { FacebookPageAccessService } from './services/access/facebook-page-acess.service';
import { FacebookListenerService } from './services/facebook-listener.service';

@Module({
  providers: [
    FacebookAdAccountAccessService,
    FacebookBusinessAccessService,
    FacebookCatalogAccessService,
    FacebookPageAccessService,
    FacebookListenerService
  ],
  imports: [UsersModule],
  controllers: [FacebookAccessController, FacebookController]
})
export class FacebookModule {
}
