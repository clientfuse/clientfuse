import { TConnectionResultResponse } from '@clientfuse/models';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, SortOrder } from 'mongoose';
import { CreateConnectionResultDto, FilterConnectionResultDto, UpdateConnectionResultDto } from '../dto';
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

  async findAll(filter: FilterConnectionResultDto): Promise<{
    data: TConnectionResultResponse[];
    total: number;
    page: number;
    limit: number;
  }> {
    const query = this.buildMongoQuery(filter);
    const skip = filter.skip || 0;
    const limit = filter.limit || 15;
    const sortBy = filter.sortBy || 'createdAt';
    const sortOrder = filter.sortOrder || 'desc';

    const sortOptions: Record<string, SortOrder> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1
    };

    const [results, total] = await Promise.all([
      this.connectionResultModel
        .find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.connectionResultModel.countDocuments(query).exec()
    ]);

    return {
      data: results.map((doc) => doc.toJSON() as unknown as TConnectionResultResponse),
      total,
      page: Math.floor(skip / limit) + 1,
      limit
    };
  }

  async findOne(filter: FilterConnectionResultDto & { _id?: string }): Promise<TConnectionResultResponse | null> {
    const query = this.buildMongoQuery(filter);
    const result = await this.connectionResultModel.findOne(query).exec();
    return result ? result.toJSON() as unknown as TConnectionResultResponse : null;
  }

  async findById(id: string): Promise<TConnectionResultResponse | null> {
    const result = await this.connectionResultModel.findById(id).exec();
    return result ? result.toJSON() as unknown as TConnectionResultResponse : null;
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

  private buildMongoQuery(filter: FilterConnectionResultDto & { _id?: string }): FilterQuery<ConnectionResultDocument> {
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

    // Date filtering
    if (filter.fromDate || filter.toDate) {
      query.createdAt = {};
      if (filter.fromDate) {
        query.createdAt.$gte = filter.fromDate;
      }
      if (filter.toDate) {
        query.createdAt.$lte = filter.toDate;
      }
    }

    // Platform filtering
    if (filter.platform && filter.platform !== 'all') {
      if (filter.platform === 'google') {
        query.googleUserId = { $exists: true, $ne: null };
      } else if (filter.platform === 'facebook') {
        query.facebookUserId = { $exists: true, $ne: null };
      }
    }

    // Access type filtering
    if (filter.accessType) {
      query.accessType = filter.accessType;
    }

    return query;
  }
}
