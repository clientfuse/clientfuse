import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConnectionLinkModule } from '../connection-link/connection-link.module';
import { UsersModule } from '../users/users.module';
import { AgenciesController } from './agencies.controller';
import { Agency, AgencySchema } from './schemas/agencies.schema';
import { AgenciesListenerService } from './services/agencies-listener.service';
import { AgenciesService } from './services/agencies.service';
import { AgencyMergeService } from './services/agency-merge.service';

@Module({
  imports: [
    UsersModule,
    ConnectionLinkModule,
    MongooseModule.forFeature([{ name: Agency.name, schema: AgencySchema }])
  ],
  controllers: [AgenciesController],
  providers: [AgenciesService, AgenciesListenerService, AgencyMergeService],
  exports: [AgenciesService, AgencyMergeService]
})
export class AgenciesModule {
}
