import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConnectionResult, ConnectionResultSchema } from './schemas/connection-result.schema';
import { ConnectionResultService } from './services/connection-result.service';
import { ConnectionResultController } from './connection-result.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ConnectionResult.name, schema: ConnectionResultSchema }
    ])
  ],
  controllers: [ConnectionResultController],
  providers: [ConnectionResultService],
  exports: [ConnectionResultService]
})
export class ConnectionResultModule {}