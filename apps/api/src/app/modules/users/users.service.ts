import { IRegistrationCredentials, IUserResponse } from '@connectly/models';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DateTime } from 'luxon';
import { Model } from 'mongoose';
import { from, map, Observable, switchMap } from 'rxjs';
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

  createUser(user: CreateUserDto): Observable<IUserResponse> {
    const newUser: IRegistrationCredentials = {...user};

    return from(this.userModel.create(newUser))
      .pipe(map((user: UserDocument) => getUserWithoutPassword({...user.toJSON()})));
  }

  findUsers(partial: Partial<IUserResponse>): Observable<IUserResponse[]> {
    return from(this.userModel.find(partial).exec())
      .pipe(map((users: UserDocument[]) => users.map((user) => getUserWithoutPassword({...user.toJSON()}))));
  }

  findUser(partial: Partial<IUserResponse>): Observable<IUserResponse | null> {
    return from(this.userModel.findOne(partial))
      .pipe(
        map((user: UserDocument) => {
          return user ? getUserWithoutPassword({...user.toJSON()}) : null;
        })
      );
  }

  findUserWithPassword(partial: Partial<IUserResponse>): Observable<(IUserResponse & IRegistrationCredentials) | null> {
    return from(this.userModel.findOne(partial))
      .pipe(
        map((user: UserDocument) => {
          return user ? user.toJSON() as unknown as (IUserResponse & IRegistrationCredentials) : null;
        })
      );
  }

  updateUser(id: string, updateUserDto: UpdateUserDto): Observable<IUserResponse> {
    return from(this.userModel.findOneAndUpdate({_id: id}, updateUserDto))
      .pipe(switchMap(() => this.findUser({_id: id})));
  }

  updateLastSeenDate(id: string): Observable<null> {
    const lastSeenDate = DateTime.now().toUnixInteger();

    return from(this.userModel.findOneAndUpdate({_id: id}, {lastSeenDate}))
      .pipe(map(() => null));
  }

  removeUser(id: string): Observable<null> {
    return from(this.userModel.deleteOne({_id: id}))
      .pipe(map(() => null));
  }
}
