import {
  TAccessLink,
  IAgencyResponse,
  TGoogleAccessLink,
  TFacebookAccessLink,
  IGoogleAccessLinkWithEmail,
  IGoogleAccessLinkWithEmailOrId,
  TFacebookAccessLinkWithId,
  IAccessLinkBase
} from '@clientfuse/models';
import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isEmpty } from 'lodash';
import { ClientSession, Model, Types } from 'mongoose';
import { Agency, AgencyDocument } from '../schemas/agencies.schema';

interface IAgencyMergeResult {
  mergedAgencyId: Types.ObjectId;
  deletedAgencyIds: Types.ObjectId[];
}

@Injectable()
export class AgencyMergeService {
  private readonly logger = new Logger(AgencyMergeService.name);

  constructor(
    @InjectModel(Agency.name) private readonly agencyModel: Model<AgencyDocument>
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

        return this.performAgencyMerge(agenciesAsPlainObjects, session);
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

    const mergedData = this.mergeAgencyData(primaryAgency, agenciesToMerge);

    this.logger.log(`Updating agency ${primaryAgency._id} with merged data:`, JSON.stringify(mergedData, null, 2));

    const cleanedDefaultAccessLink = this.cleanDefaultAccessLink(mergedData.defaultAccessLink);

    await this.agencyModel.updateOne(
      { _id: primaryAgency._id },
      {
        $set: {
          userId: mergedData.userId,
          email: mergedData.email,
          defaultAccessLink: cleanedDefaultAccessLink
        }
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

  private mergeAgencyData(primary: IAgencyResponse, agencies: IAgencyResponse[]): Partial<IAgencyResponse> {
    const merged = {
      userId: primary.userId,
      email: primary.email,
      defaultAccessLink: primary.defaultAccessLink || {}
    };

    for (const agency of agencies) {
      if (agency.defaultAccessLink) {
        merged.defaultAccessLink = this.mergeAccessLinks(
          merged.defaultAccessLink,
          agency.defaultAccessLink
        );
      }
    }

    return merged;
  }

  private mergeAccessLinks(primary: TAccessLink, secondary: TAccessLink): TAccessLink {
    const merged: TAccessLink = { ...primary };

    Object.keys(secondary).forEach(platform => {
      if (secondary[platform]) {
        merged[platform] = this.mergePlatformAccessLink(
          merged[platform] || {},
          secondary[platform]
        );
      }
    });

    return merged;
  }

  private mergePlatformAccessLink(primary: TGoogleAccessLink | TFacebookAccessLink, secondary: TGoogleAccessLink | TFacebookAccessLink): TGoogleAccessLink | TFacebookAccessLink {
    const merged = { ...primary };

    Object.keys(secondary).forEach(service => {
      if (secondary[service]) {
        merged[service] = this.mergeAccessLinkItem(primary[service], secondary[service]);
      }
    });

    return merged;
  }

  private mergeAccessLinkItem(
    primary: IGoogleAccessLinkWithEmail | IGoogleAccessLinkWithEmailOrId | TFacebookAccessLinkWithId | undefined,
    secondary: IGoogleAccessLinkWithEmail | IGoogleAccessLinkWithEmailOrId | TFacebookAccessLinkWithId | undefined
  ): IGoogleAccessLinkWithEmail | IGoogleAccessLinkWithEmailOrId | TFacebookAccessLinkWithId | undefined {
    if (!primary && secondary) return this.cleanAccessLinkItem(secondary);
    if (primary && !secondary) return this.cleanAccessLinkItem(primary);
    if (!primary && !secondary) return undefined;

    const merged: any = {
      isViewAccessEnabled: Boolean(primary.isViewAccessEnabled || secondary.isViewAccessEnabled),
      isManageAccessEnabled: Boolean(primary.isManageAccessEnabled || secondary.isManageAccessEnabled)
    };

    if (('email' in primary && primary.email) || ('email' in secondary && secondary.email)) {
      merged.email = ('email' in primary && primary.email) || ('email' in secondary && secondary.email);
    }
    if (('emailOrId' in primary && primary.emailOrId) || ('emailOrId' in secondary && secondary.emailOrId)) {
      merged.emailOrId = ('emailOrId' in primary && primary.emailOrId) || ('emailOrId' in secondary && secondary.emailOrId);
    }
    if (('entityId' in primary && primary.entityId) || ('entityId' in secondary && secondary.entityId)) {
      merged.entityId = ('entityId' in primary && primary.entityId) || ('entityId' in secondary && secondary.entityId);
    }
    if (('method' in primary && primary.method) || ('method' in secondary && secondary.method)) {
      merged.method = ('method' in primary && primary.method) || ('method' in secondary && secondary.method);
    }

    return merged;
  }

  private cleanAccessLinkItem(
    item: IGoogleAccessLinkWithEmail | IGoogleAccessLinkWithEmailOrId | TFacebookAccessLinkWithId | undefined
  ): IGoogleAccessLinkWithEmail | IGoogleAccessLinkWithEmailOrId | TFacebookAccessLinkWithId | undefined {
    if (!item) return undefined;

    const cleaned: any = {
      isViewAccessEnabled: Boolean(item.isViewAccessEnabled),
      isManageAccessEnabled: Boolean(item.isManageAccessEnabled)
    };

    if ('email' in item && item.email) cleaned.email = item.email;
    if ('emailOrId' in item && item.emailOrId) cleaned.emailOrId = item.emailOrId;
    if ('entityId' in item && item.entityId) cleaned.entityId = item.entityId;
    if ('method' in item && item.method) cleaned.method = item.method;

    return cleaned;
  }

  private cleanDefaultAccessLink(defaultAccessLink: TAccessLink): TAccessLink {
    if (!defaultAccessLink) return {};

    const cleaned: TAccessLink = {};

    if (defaultAccessLink.google) {
      cleaned.google = this.cleanPlatformAccessLink(defaultAccessLink.google) as TGoogleAccessLink;
    }

    if (defaultAccessLink.facebook) {
      cleaned.facebook = this.cleanPlatformAccessLink(defaultAccessLink.facebook) as TFacebookAccessLink;
    }

    return cleaned;
  }

  private cleanPlatformAccessLink(platformLink: TGoogleAccessLink | TFacebookAccessLink): TGoogleAccessLink | TFacebookAccessLink {
    const cleaned: any = {};

    Object.keys(platformLink).forEach(service => {
      if (service !== '_id' && platformLink[service]) {
        cleaned[service] = this.cleanAccessLinkItem(platformLink[service]);
      }
    });

    return cleaned;
  }
}
