import { ENDPOINTS, IUserResponse } from '@connectly/models';
import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller(ENDPOINTS.users.root)
export class UsersController {
  constructor(private readonly usersService: UsersService) {
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  @Get()
  findAll(@Query() partial: Partial<IUserResponse>) {
    return this.usersService.findUsers(partial);
  }

  @Get(ENDPOINTS.users.profile)
  async getProfile(@Req() req) {
    const userId: string = req.user._id;
    const res = await Promise.all([
      this.usersService.findUser({ _id: userId }),
      this.usersService.updateLastSeenDate(userId)
    ]);
    return res[0];
  }

  @Get(ENDPOINTS.users.getOne)
  findOne(@Query() partial: Partial<IUserResponse>) {
    return this.usersService.findUser(partial);
  }

  @Put(ENDPOINTS.users.editOne)
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updateUser(id, updateUserDto);
  }

  @Delete(ENDPOINTS.users.deleteOne)
  remove(@Param('id') id: string) {
    return this.usersService.removeUser(id);
  }
}
