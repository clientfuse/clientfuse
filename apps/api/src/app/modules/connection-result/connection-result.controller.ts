import { ENDPOINTS, TConnectionResultResponse } from '@clientfuse/models';
import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query
} from '@nestjs/common';
import {
  CreateConnectionResultDto,
  FilterConnectionResultDto,
  UpdateConnectionResultDto
} from './dto';
import { ConnectionResultService } from './services/connection-result.service';

@Controller(ENDPOINTS.connectionResults.root)
export class ConnectionResultController {
  constructor(private readonly connectionResultService: ConnectionResultService) {}

  @Post()
  async create(
    @Body() createDto: CreateConnectionResultDto
  ): Promise<TConnectionResultResponse> {
    return this.connectionResultService.create(createDto);
  }

  @Get()
  async findAll(
    @Query() filterDto: FilterConnectionResultDto
  ): Promise<{
    data: TConnectionResultResponse[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.connectionResultService.findAll(filterDto);
  }

  @Get(ENDPOINTS.connectionResults.one)
  async findOneByFilter(
    @Query() filterDto: FilterConnectionResultDto
  ): Promise<TConnectionResultResponse> {
    const result = await this.connectionResultService.findOne(filterDto);
    if (!result) {
      throw new NotFoundException('Connection result not found');
    }
    return result;
  }

  @Get(ENDPOINTS.connectionResults.getOne)
  async findOne(@Param('id') id: string): Promise<TConnectionResultResponse> {
    const result = await this.connectionResultService.findById(id);
    if (!result) {
      throw new NotFoundException('Connection result not found');
    }
    return result;
  }

  @Put(ENDPOINTS.connectionResults.editOne)
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateConnectionResultDto
  ): Promise<TConnectionResultResponse> {
    return this.connectionResultService.update(id, updateDto);
  }

  @Delete(ENDPOINTS.connectionResults.deleteOne)
  async delete(@Param('id') id: string): Promise<void> {
    return this.connectionResultService.delete(id);
  }
}