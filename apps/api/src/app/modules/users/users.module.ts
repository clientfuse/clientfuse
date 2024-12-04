import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UsersSchema } from './schemas/users.schema';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
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
