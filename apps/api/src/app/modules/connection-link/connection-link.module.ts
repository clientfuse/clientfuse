import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConnectionLink, ConnectionLinkSchema } from './schemas/connection-link.schema';
import { ConnectionLinkService } from './services/connection-link.service';
import { ConnectionLinkMergeService } from './services/connection-link-merge.service';
import { ConnectionLinkController } from './connection-link.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ConnectionLink.name, schema: ConnectionLinkSchema }
    ])
  ],
  controllers: [ConnectionLinkController],
  providers: [ConnectionLinkService, ConnectionLinkMergeService],
  exports: [ConnectionLinkService, ConnectionLinkMergeService]
})
export class ConnectionLinkModule {}