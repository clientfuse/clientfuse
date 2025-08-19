import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { AgenciesListenerService } from './services/agencies-listener.service';
import { AgenciesController } from './agencies.controller';
import { AgenciesService } from './services/agencies.service';
import { AgencyMergeService } from './services/agency-merge.service';
import { Agency, AgencySchema } from './schemas/agencies.schema';

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([{ name: Agency.name, schema: AgencySchema }])
  ],
  controllers: [AgenciesController],
  providers: [AgenciesService, AgenciesListenerService, AgencyMergeService],
  exports: [AgenciesService, AgencyMergeService]
})
export class AgenciesModule {
}
