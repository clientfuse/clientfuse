import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AgenciesModule } from '../agencies/agencies.module';
import { UsersModule } from '../users/users.module';
import { ConnectionLinkController } from './connection-link.controller';
import { ConnectionLink, ConnectionLinkSchema } from './schemas/connection-link.schema';
import { ConnectionLinkListenerService } from './services/connection-link-listener.service';
import { ConnectionLinkMergeService } from './services/connection-link-merge.service';
import { ConnectionLinkService } from './services/connection-link.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ConnectionLink.name, schema: ConnectionLinkSchema }
    ]),
    AgenciesModule,
    UsersModule
  ],
  controllers: [ConnectionLinkController],
  providers: [ConnectionLinkService, ConnectionLinkMergeService, ConnectionLinkListenerService]
})
export class ConnectionLinkModule {
}
