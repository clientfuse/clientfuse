import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConnectionResultController } from './connection-result.controller';
import { ConnectionResult, ConnectionResultSchema } from './schemas/connection-result.schema';
import { ConnectionResultListenerService } from './services/connection-result-listener.service';
import { ConnectionResultService } from './services/connection-result.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ConnectionResult.name, schema: ConnectionResultSchema }
    ])
  ],
  controllers: [ConnectionResultController],
  providers: [ConnectionResultService, ConnectionResultListenerService],
  exports: [ConnectionResultService]
})
export class ConnectionResultModule {
}
