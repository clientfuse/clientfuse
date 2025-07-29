import { IRegistrationCredentials, IUserResponse } from '@connectly/models';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DateTime } from 'luxon';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './schemas/users.schema';
import { getUserWithoutPassword } from './utils/user.utils';

@Injectable()
export class UsersService {

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {
  }

  async createUser(user: CreateUserDto): Promise<IUserResponse> {
    const newUser: IRegistrationCredentials = { ...user };

    const createdUser = await this.userModel.create(newUser);
    return getUserWithoutPassword({ ...createdUser.toJSON() } as unknown as IUserResponse & IRegistrationCredentials);
  }

  async findUsers(partial: Partial<IUserResponse>): Promise<IUserResponse[]> {
    const users = await this.userModel.find(partial).exec();
    return users.map((user) => {
      return getUserWithoutPassword({ ...user.toJSON() } as unknown as IUserResponse & IRegistrationCredentials);
    });
  }

  async findUser(
    partial: Partial<IUserResponse>
  ): Promise<IUserResponse | null> {
    const user = await this.userModel.findOne(partial);
    return user ? getUserWithoutPassword({ ...user.toJSON() } as unknown as IUserResponse & IRegistrationCredentials) : null;
  }

  async findUserWithPassword(
    partial: Partial<IUserResponse>
  ): Promise<(IUserResponse & IRegistrationCredentials) | null> {
    const user = await this.userModel.findOne(partial);
    return user
      ? (user.toJSON() as unknown as IUserResponse & IRegistrationCredentials)
      : null;
  }

  async updateUser(
    id: string,
    updateUserDto: UpdateUserDto
  ): Promise<IUserResponse> {
    await this.userModel.findOneAndUpdate({ _id: id }, updateUserDto);
    const updatedUser = await this.findUser({ _id: id });

    if (!updatedUser) {
      throw new Error('User not found after update');
    }

    return updatedUser;
  }

  async updateLastSeenDate(id: string): Promise<null> {
    const lastSeenDate = DateTime.now().toISO();
    await this.userModel.findOneAndUpdate({ _id: id }, { lastSeenDate });
    return null;
  }

  async removeUser(id: string): Promise<null> {
    await this.userModel.deleteOne({ _id: id });
    return null;
  }
}
