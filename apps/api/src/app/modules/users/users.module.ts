import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UsersSchema } from './schemas/users.schema';
import { UserMergeService } from './user-merge.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UserMergeService],
  exports: [UsersService, UserMergeService],
  imports: [
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UsersSchema
      }
    ])
  ]
})
export class UsersModule {
}
