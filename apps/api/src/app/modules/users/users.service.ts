import { IRegistrationCredentials, IUserResponse } from '@clientfuse/models';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DateTime } from 'luxon';
import { FilterQuery, Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './schemas/users.schema';
import { getUserWithoutSensitiveData } from './utils/user.utils';

@Injectable()
export class UsersService {

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {
  }

  async createUser(user: CreateUserDto): Promise<IUserResponse> {
    const newUser: IRegistrationCredentials = { ...user };

    const createdUser = await this.userModel.create(newUser);
    return getUserWithoutSensitiveData({ ...createdUser.toJSON() } as unknown as IUserResponse & IRegistrationCredentials);
  }

  async findUsers(partial: FilterQuery<UserDocument>): Promise<IUserResponse[]> {
    const users = await this.userModel.find(partial).exec();
    return users.map((user) => {
      return getUserWithoutSensitiveData({ ...user.toJSON() } as unknown as IUserResponse & IRegistrationCredentials);
    });
  }

  async findUser(
    partial: FilterQuery<UserDocument>
  ): Promise<IUserResponse | null> {
    const user = await this.userModel.findOne(partial);
    return user ? getUserWithoutSensitiveData({ ...user.toJSON() } as unknown as IUserResponse & IRegistrationCredentials) : null;
  }

  async findUserWithPassword(
    partial: FilterQuery<UserDocument>
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
