import {
  IGoogleAccessLinkWithEmail,
  IGoogleAccessLinkWithEmailOrId, TAccessType,
  TConnectionLink,
  TConnectionLinkResponse,
  TFacebookAccessLink,
  TFacebookConnectionLinkWithId,
  TGoogleConnectionLink,
  GoogleServiceType,
  FacebookServiceType
} from '@clientfuse/models';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { ConnectionLink, ConnectionLinkDocument } from '../schemas/connection-link.schema';

interface IConnectionLinkMergeResult {
  mergedConnectionLinkId: Types.ObjectId;
  deletedConnectionLinkIds: Types.ObjectId[];
}

@Injectable()
export class ConnectionLinkMergeService {
  private readonly logger = new Logger(ConnectionLinkMergeService.name);

  constructor(
    @InjectModel(ConnectionLink.name) private readonly connectionLinkModel: Model<ConnectionLinkDocument>
  ) {
  }

  async mergeDefaultConnectionLinks(agencyIds: string[], mergedAgencyId: string): Promise<IConnectionLinkMergeResult | null> {
    const viewResult = await this.mergeDefaultConnectionLinksByType(agencyIds, mergedAgencyId, 'view');
    const manageResult = await this.mergeDefaultConnectionLinksByType(agencyIds, mergedAgencyId, 'manage');

    await this.transferNonDefaultConnectionLinks(agencyIds, mergedAgencyId);

    if (!viewResult && !manageResult) {
      return null;
    }

    const mergedConnectionLinkId = viewResult?.mergedConnectionLinkId || manageResult?.mergedConnectionLinkId;
    const deletedConnectionLinkIds = [
      ...(viewResult?.deletedConnectionLinkIds || []),
      ...(manageResult?.deletedConnectionLinkIds || [])
    ];

    return {
      mergedConnectionLinkId,
      deletedConnectionLinkIds
    };
  }

  private async mergeDefaultConnectionLinksByType(agencyIds: string[], mergedAgencyId: string, type: TAccessType): Promise<IConnectionLinkMergeResult | null> {
    const defaultConnectionLinks = await this.connectionLinkModel
      .find({
        agencyId: { $in: agencyIds },
        isDefault: true,
        type
      })
      .sort({ createdAt: 1 })
      .exec();

    if (defaultConnectionLinks.length <= 1) {
      this.logger.log(`No duplicate default ${type} connection links found for agencies: ${agencyIds.join(', ')}`);

      if (defaultConnectionLinks.length === 1 && agencyIds.length > 0) {
        await this.connectionLinkModel.updateOne(
          { _id: defaultConnectionLinks[0]._id },
          { $set: { agencyId: mergedAgencyId } }
        );
      }

      return null;
    }

    this.logger.log(`Found ${defaultConnectionLinks.length} default ${type} connection links to merge`);

    const session = await this.connectionLinkModel.db.startSession();

    try {
      return await session.withTransaction(async () => {
        const connectionLinksAsPlainObjects: TConnectionLinkResponse[] = defaultConnectionLinks.map(doc => ({
          ...doc.toObject(),
          _id: doc._id.toString(),
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt
        }));

        const mergeResult = await this.performConnectionLinkMerge(connectionLinksAsPlainObjects, mergedAgencyId, session, agencyIds);

        return mergeResult;
      });
    } catch (error) {
      this.logger.error('Connection link merge failed', error);
      throw error;
    } finally {
      await session.endSession();
    }
  }

  private async performConnectionLinkMerge(
    connectionLinks: TConnectionLinkResponse[],
    primaryAgencyId: string,
    session: ClientSession,
    allAgencyIds: string[]
  ): Promise<IConnectionLinkMergeResult> {
    const primaryConnectionLink = this.selectPrimaryConnectionLink(connectionLinks);
    const connectionLinksToMerge = connectionLinks.filter(
      link => link._id !== primaryConnectionLink._id
    );

    this.logger.log(`Selected primary connection link: ${primaryConnectionLink._id}, merging ${connectionLinksToMerge.length} links`);

    const mergedData = this.mergeConnectionLinkData(primaryConnectionLink, connectionLinksToMerge);

    this.logger.log(`Updating connection link ${primaryConnectionLink._id} with merged data`);

    const cleanedData = this.cleanConnectionLinkData(mergedData);

    await this.connectionLinkModel.updateOne(
      { _id: primaryConnectionLink._id },
      {
        $set: {
          agencyId: primaryAgencyId,
          isDefault: true,
          ...cleanedData
        }
      },
      { session }
    );

    const deletedConnectionLinkIds = connectionLinksToMerge.map(link =>
      typeof link._id === 'string' ? new Types.ObjectId(link._id) : link._id
    );

    await this.connectionLinkModel.deleteMany(
      { _id: { $in: deletedConnectionLinkIds } },
      { session }
    );

    // Transfer non-default connection links from other agencies to the primary agency
    const otherAgencyIds = allAgencyIds.filter(id => id !== primaryAgencyId);
    if (otherAgencyIds.length > 0) {
      await this.connectionLinkModel.updateMany(
        {
          agencyId: { $in: otherAgencyIds },
          isDefault: false
        },
        { $set: { agencyId: primaryAgencyId } },
        { session }
      );
      this.logger.log(`Transferred non-default connection links from agencies ${otherAgencyIds.join(', ')} to ${primaryAgencyId}`);
    }

    this.logger.log(`Successfully merged ${connectionLinksToMerge.length} connection links into ${primaryConnectionLink._id}`);

    return {
      mergedConnectionLinkId: typeof primaryConnectionLink._id === 'string'
        ? new Types.ObjectId(primaryConnectionLink._id)
        : primaryConnectionLink._id,
      deletedConnectionLinkIds
    };
  }

  private async transferNonDefaultConnectionLinks(agencyIds: string[], primaryAgencyId: string): Promise<void> {
    const otherAgencyIds = agencyIds.filter(id => id !== primaryAgencyId);
    if (otherAgencyIds.length > 0) {
      const result = await this.connectionLinkModel.updateMany(
        {
          agencyId: { $in: otherAgencyIds },
          isDefault: false
        },
        { $set: { agencyId: primaryAgencyId } }
      );
      if (result.modifiedCount > 0) {
        this.logger.log(`Transferred ${result.modifiedCount} non-default connection links from agencies ${otherAgencyIds.join(', ')} to ${primaryAgencyId}`);
      }
    }
  }

  private selectPrimaryConnectionLink(connectionLinks: TConnectionLinkResponse[]): TConnectionLinkResponse {
    return connectionLinks.reduce((primary, current) => {
      if (current.createdAt > primary.createdAt) {
        return current;
      }
      return primary;
    });
  }

  private mergeConnectionLinkData(
    primary: TConnectionLinkResponse,
    connectionLinks: TConnectionLinkResponse[]
  ): Partial<TConnectionLinkResponse> {
    const merged: Partial<TConnectionLinkResponse> = {
      agencyId: primary.agencyId,
      isDefault: true,
      google: primary.google,
      facebook: primary.facebook
    };

    for (const link of connectionLinks) {
      if (link.google) {
        merged.google = this.mergeGoogleAccessLink(
          merged.google || undefined,
          link.google
        );
      }
      if (link.facebook) {
        merged.facebook = this.mergeFacebookAccessLink(
          merged.facebook || undefined,
          link.facebook
        );
      }
    }

    return merged;
  }

  private mergeGoogleAccessLink(
    primary: TGoogleConnectionLink | undefined,
    secondary: TGoogleConnectionLink
  ): TGoogleConnectionLink {
    if (!primary) return secondary;
    const merged: TGoogleConnectionLink = { ...primary };

    const services = Object.values(GoogleServiceType) as (keyof TGoogleConnectionLink)[];

    for (const service of services) {
      if (secondary[service]) {
        merged[service] = this.mergeGoogleServiceItem(
          primary[service],
          secondary[service]
        ) as any;
      }
    }

    return merged;
  }

  private mergeFacebookAccessLink(
    primary: TFacebookAccessLink | undefined,
    secondary: TFacebookAccessLink
  ): TFacebookAccessLink {
    if (!primary) return secondary;
    const merged: TFacebookAccessLink = { ...primary };

    const services = Object.values(FacebookServiceType) as (keyof TFacebookAccessLink)[];

    for (const service of services) {
      if (secondary[service]) {
        merged[service] = this.mergeFacebookServiceItem(
          primary[service],
          secondary[service]
        );
      }
    }

    return merged;
  }

  private mergeGoogleServiceItem(
    primary: IGoogleAccessLinkWithEmail | IGoogleAccessLinkWithEmailOrId | undefined,
    secondary: IGoogleAccessLinkWithEmail | IGoogleAccessLinkWithEmailOrId | undefined
  ): IGoogleAccessLinkWithEmail | IGoogleAccessLinkWithEmailOrId | undefined {
    if (!primary && secondary) return secondary;
    if (primary && !secondary) return primary;
    if (!primary && !secondary) return undefined;

    const merged: any = {
      isEnabled: primary.isEnabled || secondary.isEnabled
    };

    if ('email' in primary || 'email' in secondary) {
      merged.email = ('email' in primary && primary.email) || ('email' in secondary && secondary.email);
    }
    if ('emailOrId' in primary || 'emailOrId' in secondary) {
      merged.emailOrId = ('emailOrId' in primary && primary.emailOrId) || ('emailOrId' in secondary && secondary.emailOrId);
    }
    if ('method' in primary || 'method' in secondary) {
      merged.method = ('method' in primary && primary.method) || ('method' in secondary && secondary.method);
    }

    return merged;
  }

  private mergeFacebookServiceItem(
    primary: TFacebookConnectionLinkWithId | undefined,
    secondary: TFacebookConnectionLinkWithId | undefined
  ): TFacebookConnectionLinkWithId | undefined {
    if (!primary && secondary) return secondary;
    if (primary && !secondary) return primary;
    if (!primary && !secondary) return undefined;

    return {
      isEnabled: primary.isEnabled || secondary.isEnabled,
      businessPortfolioId: primary.businessPortfolioId || secondary.businessPortfolioId
    };
  }

  private cleanConnectionLinkData(data: Partial<TConnectionLinkResponse>): TConnectionLink {
    const cleaned: TConnectionLink = {};

    if (data.google) {
      cleaned.google = this.cleanPlatformAccessLink(data.google) as TGoogleConnectionLink;
    }

    if (data.facebook) {
      cleaned.facebook = this.cleanPlatformAccessLink(data.facebook) as TFacebookAccessLink;
    }

    return cleaned;
  }

  private cleanPlatformAccessLink(platformLink: TGoogleConnectionLink | TFacebookAccessLink): TGoogleConnectionLink | TFacebookAccessLink {
    const cleaned: any = {};

    Object.keys(platformLink).forEach(service => {
      if (service !== '_id' && platformLink[service]) {
        cleaned[service] = platformLink[service];
      }
    });

    return cleaned;
  }
}
