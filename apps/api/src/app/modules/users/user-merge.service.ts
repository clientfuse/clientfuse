import { IFacebookInfo, IGoogleInfo, IUserResponse } from '@clientfuse/models';
import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isEmpty, isNil, uniqBy } from 'lodash';
import { ClientSession, Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/users.schema';


@Injectable()
export class UserMergeService {
  private readonly logger = new Logger(UserMergeService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>
  ) {
  }

  async mergeAccountsByEmail(email: string) {
    const normalizedEmail = email.toLowerCase().trim();

    if (isEmpty(normalizedEmail)) {
      throw new ConflictException('Email cannot be empty');
    }

    const duplicateAccounts = await this.userModel
      .find({ email: normalizedEmail })
      .sort({ createdAt: 1 })
      .exec();

    if (duplicateAccounts.length <= 1) {
      this.logger.log(`No duplicates found for email: ${normalizedEmail}`);
      return null;
    }

    this.logger.log(`Found ${duplicateAccounts.length} duplicate accounts for email: ${normalizedEmail}`);

    const session = await this.userModel.db.startSession();

    try {
      return await session.withTransaction(async () => {
        const accountsAsPlainObjects = duplicateAccounts.map(doc => ({
          ...doc.toObject(),
          _id: doc._id.toString(),
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt
        })) as IUserResponse[];

        return this.performAccountMerge(accountsAsPlainObjects, session);
      });
    } catch (error) {
      this.logger.error('Account merge failed', error);
      throw error;
    } finally {
      await session.endSession();
    }
  }

  private async performAccountMerge(
    accounts: IUserResponse[],
    session: ClientSession
  ) {
    const primaryAccount = this.selectPrimaryAccount(accounts);
    const accountsToMerge = accounts.filter(
      account => account._id !== primaryAccount._id
    );

    this.logger.log(`Selected primary account: ${primaryAccount._id}, merging ${accountsToMerge.length} accounts`);

    const mergedData = this.mergeUserData(primaryAccount, accountsToMerge);

    await this.userModel.updateOne(
      { _id: primaryAccount._id },
      { $set: { ...mergedData } },
      { session }
    );

    const deletedUserIds = accountsToMerge.map(account =>
      typeof account._id === 'string' ? new Types.ObjectId(account._id) : account._id
    );

    await this.userModel.deleteMany(
      { _id: { $in: deletedUserIds } },
      { session }
    );

    this.logger.log(`Successfully merged ${accountsToMerge.length} accounts into ${primaryAccount._id}`);

    return {
      mergedUserId: typeof primaryAccount._id === 'string'
        ? new Types.ObjectId(primaryAccount._id)
        : primaryAccount._id,
      deletedUserIds
    };
  }

  private selectPrimaryAccount(accounts: IUserResponse[]): IUserResponse {
    return accounts.reduce((primary, current) => {

      if (current.createdAt > primary.createdAt) {
        return current;
      }

      return primary;
    });
  }

  private mergeUserData(primary: IUserResponse, accounts: IUserResponse[]): Partial<IUserResponse> {
    const merged: Partial<IUserResponse> = { ...primary };

    for (const account of accounts) {
      if (isEmpty(merged.firstName) && !isEmpty(account.firstName)) {
        merged.firstName = account.firstName;
      }
      if (isEmpty(merged.lastName) && !isEmpty(account.lastName)) {
        merged.lastName = account.lastName;
      }
      if (isNil(merged.birthDate) && !isNil(account.birthDate)) {
        merged.birthDate = account.birthDate;
      }
      if (isEmpty(merged.phone) && !isEmpty(account.phone)) {
        merged.phone = account.phone;
      }

      merged.isLoggedInWithGoogle = merged.isLoggedInWithGoogle || account.isLoggedInWithGoogle;
      merged.isLoggedInWithFacebook = merged.isLoggedInWithFacebook || account.isLoggedInWithFacebook;

      if (merged.google && account.google) {
        merged.google = this.mergeGoogleData(merged.google, account.google);
      } else if (account.google) {
        merged.google = account.google;
      }

      if (merged.facebook && account.facebook) {
        merged.facebook = this.mergeFacebookData(merged.facebook, account.facebook);
      } else if (account.facebook) {
        merged.facebook = account.facebook;
      }

      if (account.lastSeenDate && merged.lastSeenDate && account.lastSeenDate > merged.lastSeenDate) {
        merged.lastSeenDate = account.lastSeenDate;
      } else if (account.lastSeenDate && !merged.lastSeenDate) {
        merged.lastSeenDate = account.lastSeenDate;
      }
    }

    return merged;
  }

  private mergeGoogleData(primary: IGoogleInfo, secondary: IGoogleInfo): IGoogleInfo {
    const merged = { ...primary };

    if (!merged.accessToken && secondary.accessToken) {
      merged.accessToken = secondary.accessToken;
    }
    if (!merged.refreshToken && secondary.refreshToken) {
      merged.refreshToken = secondary.refreshToken;
    }
    if (!merged.userId && secondary.userId) {
      merged.userId = secondary.userId;
    }
    if (!merged.email && secondary.email) {
      merged.email = secondary.email;
    }

    if (
      secondary.tokenExpirationDate &&
      (!merged.tokenExpirationDate || secondary.tokenExpirationDate > merged.tokenExpirationDate)
    ) {
      merged.tokenExpirationDate = secondary.tokenExpirationDate;
    }

    merged.adsAccounts = this.mergeArrays(merged.adsAccounts, secondary.adsAccounts);
    merged.analyticsAccounts = this.mergeArrays(merged.analyticsAccounts, secondary.analyticsAccounts);
    merged.grantedScopes = this.mergeStringArrays(merged.grantedScopes, secondary.grantedScopes);
    merged.merchantCenters = this.mergeArrays(merged.merchantCenters, secondary.merchantCenters);
    merged.myBusinessAccounts = this.mergeArrays(merged.myBusinessAccounts, secondary.myBusinessAccounts);
    merged.myBusinessLocations = this.mergeArrays(merged.myBusinessLocations, secondary.myBusinessLocations);
    merged.searchConsoles = this.mergeArrays(merged.searchConsoles, secondary.searchConsoles);
    merged.tagManagers = this.mergeArrays(merged.tagManagers, secondary.tagManagers);

    return merged;
  }

  private mergeFacebookData(primary: IFacebookInfo, secondary: IFacebookInfo): IFacebookInfo {
    const merged = { ...primary };

    if (!merged.accessToken && secondary.accessToken) {
      merged.accessToken = secondary.accessToken;
    }
    if (!merged.userId && secondary.userId) {
      merged.userId = secondary.userId;
    }
    if (!merged.email && secondary.email) {
      merged.email = secondary.email;
    }

    merged.grantedScopes = this.mergeStringArrays(merged.grantedScopes, secondary.grantedScopes);
    merged.adsAccounts = this.mergeArrays(merged.adsAccounts, secondary.adsAccounts);
    merged.businessAccounts = this.mergeArrays(merged.businessAccounts, secondary.businessAccounts);
    merged.pages = this.mergeArrays(merged.pages, secondary.pages);
    merged.catalogs = this.mergeArrays(merged.catalogs, secondary.catalogs);
    merged.pixels = this.mergeArrays(merged.pixels, secondary.pixels);

    return merged;
  }

  private mergeArrays(arr1: any[], arr2: any[]): any[] {
    if (!arr1?.length) return arr2 || [];
    if (!arr2?.length) return arr1;

    const combined = [...arr1, ...arr2];

    return uniqBy(combined, item => item.id || JSON.stringify(item));
  }

  private mergeStringArrays(arr1: string[], arr2: string[]): string[] {
    if (!arr1?.length) return arr2 || [];
    if (!arr2?.length) return arr1;

    return [...new Set([...arr1, ...arr2])];
  }
}
