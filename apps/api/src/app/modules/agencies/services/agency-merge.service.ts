import { IAgencyResponse } from '@clientfuse/models';
import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isEmpty } from 'lodash';
import { ClientSession, Model, Types } from 'mongoose';
import { ConnectionLinkMergeService } from '../../connection-link/services/connection-link-merge.service';
import { Agency, AgencyDocument } from '../schemas/agencies.schema';

interface IAgencyMergeResult {
  mergedAgencyId: Types.ObjectId;
  deletedAgencyIds: Types.ObjectId[];
}

@Injectable()
export class AgencyMergeService {
  private readonly logger = new Logger(AgencyMergeService.name);

  constructor(
    @InjectModel(Agency.name) private readonly agencyModel: Model<AgencyDocument>,
    private connectionLinkMergeService: ConnectionLinkMergeService
  ) {
  }

  async mergeAgenciesByUserId(userId: string): Promise<IAgencyMergeResult | null> {
    if (isEmpty(userId)) {
      throw new ConflictException('UserId cannot be empty');
    }

    const duplicateAgencies = await this.agencyModel
      .find({ userId })
      .sort({ createdAt: 1 })
      .exec();

    if (duplicateAgencies.length <= 1) {
      this.logger.log(`No duplicate agencies found for userId: ${userId}`);
      return null;
    }

    this.logger.log(`Found ${duplicateAgencies.length} duplicate agencies for userId: ${userId}`);

    const session = await this.agencyModel.db.startSession();

    try {
      return await session.withTransaction(async () => {
        const agenciesAsPlainObjects: IAgencyResponse[] = duplicateAgencies.map(doc => ({
          ...doc.toObject(),
          _id: doc._id.toString(),
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt
        }));

        const mergeResult = await this.performAgencyMerge(agenciesAsPlainObjects, session);
        const allAgencyIds = duplicateAgencies.map(a => a._id.toString());
        const mergedAgencyIdString = mergeResult.mergedAgencyId.toString();
        await this.connectionLinkMergeService.mergeDefaultConnectionLinks(allAgencyIds, mergedAgencyIdString);

        return mergeResult;
      });
    } catch (error) {
      this.logger.error('Agency merge failed', error);
      throw error;
    } finally {
      await session.endSession();
    }
  }

  private async performAgencyMerge(
    agencies: IAgencyResponse[],
    session: ClientSession
  ): Promise<IAgencyMergeResult> {
    const primaryAgency = this.selectPrimaryAgency(agencies);
    const agenciesToMerge = agencies.filter(
      agency => agency._id !== primaryAgency._id
    );

    this.logger.log(`Selected primary agency: ${primaryAgency._id}, merging ${agenciesToMerge.length} agencies`);

    const mergedData = {
      userId: primaryAgency.userId,
      email: primaryAgency.email
    };

    this.logger.log(`Updating agency ${primaryAgency._id} with merged data:`, JSON.stringify(mergedData, null, 2));

    await this.agencyModel.updateOne(
      { _id: primaryAgency._id },
      {
        $set: mergedData
      },
      { session }
    );

    const deletedAgencyIds = agenciesToMerge.map(agency =>
      typeof agency._id === 'string' ? new Types.ObjectId(agency._id) : agency._id
    );

    await this.agencyModel.deleteMany(
      { _id: { $in: deletedAgencyIds } },
      { session }
    );

    this.logger.log(`Successfully merged ${agenciesToMerge.length} agencies into ${primaryAgency._id}`);

    return {
      mergedAgencyId: typeof primaryAgency._id === 'string'
        ? new Types.ObjectId(primaryAgency._id)
        : primaryAgency._id,
      deletedAgencyIds
    };
  }

  private selectPrimaryAgency(agencies: IAgencyResponse[]): IAgencyResponse {
    return agencies.reduce((primary, current) => {
      if (current.createdAt > primary.createdAt) {
        return current;
      }
      return primary;
    });
  }

}
