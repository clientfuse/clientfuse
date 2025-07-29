import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { AgenciesListenerService } from './agencies-listener.service';
import { AgenciesController } from './agencies.controller';
import { AgenciesService } from './agencies.service';
import { Agency, AgencySchema } from './schemas/agencies.schema';

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([{ name: Agency.name, schema: AgencySchema }])
  ],
  controllers: [AgenciesController],
  providers: [AgenciesService, AgenciesListenerService],
  exports: [AgenciesService]
})
export class AgenciesModule {
}
