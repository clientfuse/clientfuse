import { IRegistrationCredentials, IUserResponse } from '@connectly/models';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { from, map } from 'rxjs';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './schemas/users.schema';
import { getUserWithoutPassword } from './utils/user.utils';

@Injectable()
export class UsersService {

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>
  ) {
  }

  create(user: CreateUserDto) {
    const newUser: IRegistrationCredentials = {...user};

    return from(this.userModel.create(newUser))
      .pipe(
        map((user: UserDocument) => getUserWithoutPassword({
          ...user.toJSON(),
          _id: user._id.toString()
        }))
      );
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(partial: Partial<IUserResponse>) {
    return from(this.userModel.findOne(partial));
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
