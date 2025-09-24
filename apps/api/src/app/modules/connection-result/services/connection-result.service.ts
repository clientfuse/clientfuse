import { TConnectionResultFilter, TConnectionResultResponse } from '@clientfuse/models';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { CreateConnectionResultDto, UpdateConnectionResultDto } from '../dto';
import { ConnectionResult, ConnectionResultDocument } from '../schemas/connection-result.schema';

@Injectable()
export class ConnectionResultService {
  constructor(
    @InjectModel(ConnectionResult.name)
    private connectionResultModel: Model<ConnectionResultDocument>
  ) {}

  async create(dto: CreateConnectionResultDto): Promise<TConnectionResultResponse> {
    const createdResult = await this.connectionResultModel.create(dto);
    return createdResult.toJSON() as unknown as TConnectionResultResponse;
  }

  async findAll(filter: TConnectionResultFilter): Promise<TConnectionResultResponse[]> {
    const query = this.buildMongoQuery(filter);
    const results = await this.connectionResultModel.find(query).exec();
    return results.map((doc) => doc.toJSON() as unknown as TConnectionResultResponse);
  }

  async findOne(filter: TConnectionResultFilter & { _id?: string }): Promise<TConnectionResultResponse | null> {
    const query = this.buildMongoQuery(filter);
    const result = await this.connectionResultModel.findOne(query).exec();
    return result ? result.toJSON() as unknown as TConnectionResultResponse : null;
  }

  async findById(id: string): Promise<TConnectionResultResponse | null> {
    const result = await this.connectionResultModel.findById(id).exec();
    return result ? result.toJSON() as unknown as TConnectionResultResponse : null;
  }

  async findByAgency(agencyId: string): Promise<TConnectionResultResponse[]> {
    const results = await this.connectionResultModel.find({ agencyId }).exec();
    return results.map((doc) => doc.toJSON() as unknown as TConnectionResultResponse);
  }

  async update(id: string, dto: UpdateConnectionResultDto): Promise<TConnectionResultResponse> {
    const updatedResult = await this.connectionResultModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();

    if (!updatedResult) {
      throw new NotFoundException('Connection result not found');
    }

    return updatedResult.toJSON() as unknown as TConnectionResultResponse;
  }

  async delete(id: string): Promise<void> {
    const result = await this.connectionResultModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException('Connection result not found');
    }
  }

  private buildMongoQuery(filter: TConnectionResultFilter & { _id?: string }): FilterQuery<ConnectionResultDocument> {
    const query: FilterQuery<ConnectionResultDocument> = {};

    if (filter._id) {
      query._id = filter._id;
    }

    if (filter.agencyId) {
      query.agencyId = filter.agencyId;
    }

    if (filter.connectionLinkId) {
      query.connectionLinkId = filter.connectionLinkId;
    }

    if (filter.googleUserId) {
      query.googleUserId = filter.googleUserId;
    }

    if (filter.facebookUserId) {
      query.facebookUserId = filter.facebookUserId;
    }

    return query;
  }
}
