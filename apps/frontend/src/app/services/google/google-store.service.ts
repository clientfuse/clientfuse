import { computed, inject, Injectable, signal } from '@angular/core';
import {
  GoogleServiceType,
  IGetEntityUsersQueryDto,
  IGetEntityUsersResponse,
  IGoogleConnectionDto,
  IGoogleConnectionResponse,
  IGrantAccessResponse,
  IGrantCustomAccessDto,
  IGrantManagementAccessDto,
  IGrantReadOnlyAccessDto,
  IRevokeAccessResponse,
  IRevokeAgencyAccessDto
} from '@clientfuse/models';
import { GoogleApiService } from './google-api.service';

export interface GoogleStoreState {
  connectionData: IGoogleConnectionResponse | null;
  entityUsers: IGetEntityUsersResponse | null;
  currentUserId: string | null;
  isLoading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class GoogleStoreService {
  private googleApiService = inject(GoogleApiService);

  private state = signal<GoogleStoreState>({
    connectionData: null,
    entityUsers: null,
    currentUserId: null,
    isLoading: false,
    error: null
  });

  readonly connectionData = computed(() => this.state().connectionData);
  readonly entityUsers = computed(() => this.state().entityUsers);
  readonly currentUserId = computed(() => this.state().currentUserId);
  readonly isLoading = computed(() => this.state().isLoading);
  readonly error = computed(() => this.state().error);

  async connectGoogle(dto: IGoogleConnectionDto): Promise<void> {
    this.setLoading(true);
    this.clearError();

    try {
      const response = await this.googleApiService.connectGoogle(dto);
      if (response.payload) {
        this.state.update(state => ({
          ...state,
          connectionData: response.payload
        }));
      } else {
        this.setError('Failed to connect Google account');
      }
    } catch (error) {
      this.setError('An error occurred while connecting Google account');
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  async grantManagementAccess(dto: IGrantManagementAccessDto): Promise<IGrantAccessResponse | null> {
    this.setLoading(true);
    this.clearError();

    try {
      const response = await this.googleApiService.grantManagementAccess(dto);
      if (response.payload) {
        return response.payload;
      } else {
        this.setError('Failed to grant management access');
        return null;
      }
    } catch (error) {
      this.setError('An error occurred while granting management access');
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  async grantReadOnlyAccess(dto: IGrantReadOnlyAccessDto): Promise<IGrantAccessResponse | null> {
    this.setLoading(true);
    this.clearError();

    try {
      const response = await this.googleApiService.grantReadOnlyAccess(dto);
      if (response.payload) {
        return response.payload;
      } else {
        this.setError('Failed to grant read-only access');
        return null;
      }
    } catch (error) {
      this.setError('An error occurred while granting read-only access');
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  async grantCustomAccess(dto: IGrantCustomAccessDto): Promise<IGrantAccessResponse | null> {
    this.setLoading(true);
    this.clearError();

    try {
      const response = await this.googleApiService.grantCustomAccess(dto);
      if (response.payload) {
        return response.payload;
      } else {
        this.setError('Failed to grant custom access');
        return null;
      }
    } catch (error) {
      this.setError('An error occurred while granting custom access');
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  async loadEntityUsers(dto: IGetEntityUsersQueryDto & {
    service: GoogleServiceType;
    entityId: string;
  }): Promise<void> {
    this.setLoading(true);
    this.clearError();

    try {
      const response = await this.googleApiService.getEntityUsers(dto);
      if (response.payload) {
        this.state.update(state => ({
          ...state,
          entityUsers: response.payload,
          currentUserId: dto.userId
        }));
      } else {
        this.setError('Failed to load entity users');
      }
    } catch (error) {
      this.setError('An error occurred while loading entity users');
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  async revokeAgencyAccess(dto: IRevokeAgencyAccessDto): Promise<IRevokeAccessResponse | null> {
    this.setLoading(true);
    this.clearError();

    try {
      const response = await this.googleApiService.revokeAgencyAccess(dto);
      if (response.payload) {
        if (this.state().entityUsers) {
          await this.refreshEntityUsers();
        }
        return response.payload;
      } else {
        this.setError('Failed to revoke agency access');
        return null;
      }
    } catch (error) {
      this.setError('An error occurred while revoking agency access');
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  private async refreshEntityUsers(): Promise<void> {
    const currentEntityUsers = this.state().entityUsers;
    const currentUserId = this.state().currentUserId;
    if (currentEntityUsers && currentEntityUsers.entityId && currentEntityUsers.service && currentUserId) {
      await this.loadEntityUsers({
        service: currentEntityUsers.service as GoogleServiceType,
        entityId: currentEntityUsers.entityId,
        userId: currentUserId
      });
    }
  }

  clearConnectionData(): void {
    this.state.update(state => ({
      ...state,
      connectionData: null
    }));
  }

  clearEntityUsers(): void {
    this.state.update(state => ({
      ...state,
      entityUsers: null
    }));
  }

  clearAll(): void {
    this.state.set({
      connectionData: null,
      entityUsers: null,
      currentUserId: null,
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
