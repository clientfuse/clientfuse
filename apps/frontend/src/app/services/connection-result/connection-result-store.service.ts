import { computed, inject, Injectable, signal } from '@angular/core';
import {
  TConnectionResultResponse,
  TBaseConnectionResult,
  IGrantAccessResponse,
  TConnectionResultFilter,
  TPlatformNamesKeys,
  TAccessType
} from '@clientfuse/models';
import { ConnectionResultApiService } from './connection-result-api.service';

export interface ConnectionResultState {
  currentResult: TConnectionResultResponse | null;
  isLoading: boolean;
  error: string | null;
}


@Injectable({
  providedIn: 'root'
})
export class ConnectionResultStoreService {
  private connectionResultApiService = inject(ConnectionResultApiService);

  private readonly PLATFORM_USER_ID_KEYS: Record<TPlatformNamesKeys, string> = {
    google: 'googleUserId',
    facebook: 'facebookUserId'
  };

  private getPlatformUserIdKey(platform: TPlatformNamesKeys): keyof TConnectionResultResponse {
    return this.PLATFORM_USER_ID_KEYS[platform] as keyof TConnectionResultResponse;
  }

  private state = signal<ConnectionResultState>({
    currentResult: null,
    isLoading: false,
    error: null
  });

  readonly currentResult = computed(() => this.state().currentResult);
  readonly isLoading = computed(() => this.state().isLoading);
  readonly error = computed(() => this.state().error);

  readonly googleGrantedAccesses = computed(() => {
    const result = this.state().currentResult;
    if (!result || !result.grantedAccesses) return [];
    return result.grantedAccesses['google'] || [];
  });

  readonly facebookGrantedAccesses = computed(() => {
    const result = this.state().currentResult;
    if (!result || !result.grantedAccesses) return [];
    return result.grantedAccesses['facebook'] || [];
  });

  readonly allGrantedAccesses = computed(() => {
    const result = this.state().currentResult;
    if (!result) return [];

    const allAccesses: IGrantAccessResponse[] = [];

    Object.values(result.grantedAccesses).forEach(platformAccesses => {
      if (Array.isArray(platformAccesses)) {
        allAccesses.push(...platformAccesses);
      }
    });

    return allAccesses;
  });

  async loadOrCreateResult(
    platform: TPlatformNamesKeys,
    userId: string,
    connectionLinkId: string,
    agencyId: string,
    accessType: TAccessType
  ): Promise<TConnectionResultResponse | null> {
    this.setLoading(true);
    this.clearError();

    try {
      const currentResult = this.state().currentResult;

      if (currentResult) {
        const platformUserIdKey = this.getPlatformUserIdKey(platform);
        const currentPlatformUserId = currentResult[platformUserIdKey] as string | undefined;

        if (!currentPlatformUserId) {
          const updatedResult = await this.mergeWithExistingResult(platform, userId);
          return updatedResult;
        }

        return currentResult;
      }

      const filter: TConnectionResultFilter = {
        connectionLinkId,
        [this.getPlatformUserIdKey(platform)]: userId
      };

      const searchResponse = await this.connectionResultApiService.findOne(filter);

      if (searchResponse.payload) {
        this.state.update(state => ({
          ...state,
          currentResult: searchResponse.payload
        }));
        return searchResponse.payload;
      }

      console.log('No existing connection result found, creating new one...');

      const newResult: TBaseConnectionResult = {
        agencyId,
        connectionLinkId,
        [this.getPlatformUserIdKey(platform)]: userId,
        accessType,
        grantedAccesses: {
          google: [],
          facebook: []
        }
      };

      const createResponse = await this.connectionResultApiService.create(newResult);

      if (createResponse.payload) {
        console.log('Connection result created successfully:', createResponse.payload);
        this.state.update(state => ({
          ...state,
          currentResult: createResponse.payload
        }));
        return createResponse.payload;
      }

      this.setError('Failed to create connection result');
      return null;
    } catch (error) {
      console.error('Error loading/creating connection result:', error);
      this.setError('An error occurred while loading connection result');
      return null;
    } finally {
      this.setLoading(false);
    }
  }

  async mergeWithExistingResult(
    newPlatform: TPlatformNamesKeys,
    newUserId: string
  ): Promise<TConnectionResultResponse | null> {
    const currentResult = this.state().currentResult;

    if (!currentResult) {
      this.setError('No existing result to merge with');
      return null;
    }

    this.setLoading(true);
    this.clearError();

    try {
      const platformUserIdKey = this.getPlatformUserIdKey(newPlatform);

      const filter: TConnectionResultFilter = {
        connectionLinkId: currentResult.connectionLinkId,
        [platformUserIdKey]: newUserId
      };

      const existingWithNewUserId = await this.connectionResultApiService.findOne(filter);

      let updatedResult: Partial<TBaseConnectionResult>;

      if (existingWithNewUserId.payload) {
        const mergedAccesses = { ...currentResult.grantedAccesses };
        Object.keys(existingWithNewUserId.payload.grantedAccesses).forEach(platform => {
          const key = platform as TPlatformNamesKeys;
          mergedAccesses[key] = [
            ...(mergedAccesses[key] || []),
            ...(existingWithNewUserId.payload.grantedAccesses[key] || [])
          ];
        });

        updatedResult = {
          ...currentResult,
          [platformUserIdKey]: newUserId,
          grantedAccesses: mergedAccesses
        };

        await this.connectionResultApiService.delete(existingWithNewUserId.payload._id);
      } else {
        updatedResult = {
          ...currentResult,
          [platformUserIdKey]: newUserId
        };
      }

      const updateResponse = await this.connectionResultApiService.update(
        currentResult._id,
        updatedResult
      );

      if (updateResponse.payload) {
        this.state.update(state => ({
          ...state,
          currentResult: updateResponse.payload
        }));
        return updateResponse.payload;
      }

      this.setError('Failed to merge results');
      return null;
    } catch (error) {
      console.error('Error merging results:', error);
      this.setError('An error occurred while merging results');
      return null;
    } finally {
      this.setLoading(false);
    }
  }

  async addGrantedAccess(
    platform: TPlatformNamesKeys,
    access: IGrantAccessResponse
  ): Promise<TConnectionResultResponse | null> {
    const currentResult = this.state().currentResult;

    if (!currentResult) {
      this.setError('No connection result to add access to');
      return null;
    }

    this.setLoading(true);
    this.clearError();

    try {
      // Check if this access already exists (by service and entityId)
      const existingAccesses = currentResult.grantedAccesses[platform] || [];
      const existingIndex = existingAccesses.findIndex(
        a => a.service === access.service && a.entityId === access.entityId
      );

      let updatedPlatformAccesses: IGrantAccessResponse[];

      if (existingIndex !== -1) {
        // Update existing access
        updatedPlatformAccesses = [...existingAccesses];
        updatedPlatformAccesses[existingIndex] = access;
      } else {
        // Add new access
        updatedPlatformAccesses = [...existingAccesses, access];
      }

      const updatedResult: Partial<TBaseConnectionResult> = {
        ...currentResult,
        grantedAccesses: {
          ...currentResult.grantedAccesses,
          [platform]: updatedPlatformAccesses
        }
      };

      const updateResponse = await this.connectionResultApiService.update(
        currentResult._id,
        updatedResult
      );

      if (updateResponse.payload) {
        this.state.update(state => ({
          ...state,
          currentResult: updateResponse.payload
        }));
        return updateResponse.payload;
      }

      this.setError('Failed to add granted access');
      return null;
    } catch (error) {
      console.error('Error adding granted access:', error);
      this.setError('An error occurred while adding granted access');
      return null;
    } finally {
      this.setLoading(false);
    }
  }

  async removeGrantedAccess(
    platform: TPlatformNamesKeys,
    service: string,
    entityId: string
  ): Promise<TConnectionResultResponse | null> {
    const currentResult = this.state().currentResult;

    if (!currentResult) {
      this.setError('No connection result to remove access from');
      return null;
    }

    this.setLoading(true);
    this.clearError();

    try {
      const existingAccesses = currentResult.grantedAccesses[platform] || [];
      const updatedPlatformAccesses = existingAccesses.filter(
        a => !(a.service === service && a.entityId === entityId)
      );

      const updatedResult: Partial<TBaseConnectionResult> = {
        ...currentResult,
        grantedAccesses: {
          ...currentResult.grantedAccesses,
          [platform]: updatedPlatformAccesses
        }
      };

      const updateResponse = await this.connectionResultApiService.update(
        currentResult._id,
        updatedResult
      );

      if (updateResponse.payload) {
        this.state.update(state => ({
          ...state,
          currentResult: updateResponse.payload
        }));
        return updateResponse.payload;
      }

      this.setError('Failed to remove granted access');
      return null;
    } catch (error) {
      console.error('Error removing granted access:', error);
      this.setError('An error occurred while removing granted access');
      return null;
    } finally {
      this.setLoading(false);
    }
  }

  getGrantedAccessByEntity(
    platform: TPlatformNamesKeys,
    service: string,
    entityId: string
  ): IGrantAccessResponse | undefined {
    const currentResult = this.state().currentResult;
    if (!currentResult) return undefined;

    const platformAccesses = currentResult.grantedAccesses[platform] || [];
    return platformAccesses.find(
      access => access.service === service && access.entityId === entityId
    );
  }

  getSessionSummary(): {
    totalGranted: number;
    googleCount: number;
    facebookCount: number;
    services: string[]
  } {
    const currentResult = this.state().currentResult;
    if (!currentResult) {
      return {
        totalGranted: 0,
        googleCount: 0,
        facebookCount: 0,
        services: []
      };
    }

    const googleAccesses = currentResult.grantedAccesses['google'] || [];
    const facebookAccesses = currentResult.grantedAccesses['facebook'] || [];

    const allServices = [
      ...googleAccesses.map(a => a.service),
      ...facebookAccesses.map(a => a.service)
    ];

    const uniqueServices = [...new Set(allServices)];

    return {
      totalGranted: googleAccesses.length + facebookAccesses.length,
      googleCount: googleAccesses.length,
      facebookCount: facebookAccesses.length,
      services: uniqueServices
    };
  }

  clearCurrentResult(): void {
    this.state.update(state => ({
      ...state,
      currentResult: null
    }));
  }

  clearAll(): void {
    this.state.set({
      currentResult: null,
      isLoading: false,
      error: null
    });
  }

  private setLoading(isLoading: boolean): void {
    this.state.update(state => ({
      ...state,
      isLoading
    }));
  }

  private setError(error: string | null): void {
    this.state.update(state => ({
      ...state,
      error
    }));
  }

  private clearError(): void {
    this.setError(null);
  }
}
