import { computed, inject, Injectable, signal } from '@angular/core';
import {
  GoogleServiceType,
  IGetEntityUsersQueryDto,
  IGetEntityUsersResponse,
  IGoogleConnectionDto,
  IGoogleConnectionResponse,
  IGrantAccessResponse,
  IGrantAgencyAccessDto,
  IRevokeAccessResponse,
  IRevokeAgencyAccessDto
} from '@clientfuse/models';
import { ConnectionResultStoreService } from '../connection-result/connection-result-store.service';
import { GoogleApiService } from './google-api.service';

export interface GoogleStoreState {
  connectionData: IGoogleConnectionResponse | null;
  entityUsers: IGetEntityUsersResponse | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class GoogleStoreService {
  private googleApiService = inject(GoogleApiService);
  private connectionResultStore = inject(ConnectionResultStoreService);

  private state = signal<GoogleStoreState>({
    connectionData: null,
    entityUsers: null,
    accessToken: null,
    isLoading: false,
    error: null
  });

  readonly connectionData = computed(() => this.state().connectionData);
  readonly entityUsers = computed(() => this.state().entityUsers);
  readonly accessToken = computed(() => this.state().accessToken);
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
          connectionData: response.payload,
          accessToken: dto.accessToken
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

  async grantManagementAccess(dto: Omit<IGrantAgencyAccessDto, 'accessToken'>): Promise<IGrantAccessResponse | null> {
    this.setLoading(true);
    this.clearError();

    const accessToken = this.state().accessToken;

    if (!accessToken) {
      this.setError('User must be authenticated with Google');
      this.setLoading(false);
      return null;
    }

    try {
      const fullDto = {
        ...dto,
        accessToken
      } as IGrantAgencyAccessDto;

      const response = await this.googleApiService.grantManagementAccess(fullDto);
      if (response.payload) {
        await this.connectionResultStore.addGrantedAccess('google', response.payload);
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

  async grantViewAccess(dto: Omit<IGrantAgencyAccessDto, 'accessToken'>): Promise<IGrantAccessResponse | null> {
    this.setLoading(true);
    this.clearError();

    const accessToken = this.state().accessToken;

    if (!accessToken) {
      this.setError('User must be authenticated with Google');
      this.setLoading(false);
      return null;
    }

    try {
      const fullDto = {
        ...dto,
        accessToken
      } as IGrantAgencyAccessDto;

      const response = await this.googleApiService.grantViewAccess(fullDto);
      if (response.payload) {
        await this.connectionResultStore.addGrantedAccess('google', response.payload);
        return response.payload;
      } else {
        this.setError('Failed to grant view access');
        return null;
      }
    } catch (error) {
      this.setError('An error occurred while granting view access');
      throw error;
    } finally {
      this.setLoading(false);
    }
  }


  async loadEntityUsers(dto: Omit<IGetEntityUsersQueryDto, 'accessToken'> & {
    service: GoogleServiceType;
    entityId: string;
  }): Promise<void> {
    this.setLoading(true);
    this.clearError();

    const accessToken = this.state().accessToken;

    if (!accessToken) {
      this.setError('User must be authenticated with Google');
      this.setLoading(false);
      return;
    }

    try {
      const fullDto = {
        ...dto,
        accessToken
      } as IGetEntityUsersQueryDto & { service: GoogleServiceType; entityId: string };

      const response = await this.googleApiService.getEntityUsers(fullDto);
      if (response.payload) {
        this.state.update(state => ({
          ...state,
          entityUsers: response.payload
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

  async revokeAgencyAccess(dto: Omit<IRevokeAgencyAccessDto, 'accessToken'>): Promise<IRevokeAccessResponse | null> {
    this.setLoading(true);
    this.clearError();

    const accessToken = this.state().accessToken;

    if (!accessToken) {
      this.setError('User must be authenticated with Google');
      this.setLoading(false);
      return null;
    }

    try {
      const fullDto = {
        ...dto,
        accessToken
      } as IRevokeAgencyAccessDto;

      const response = await this.googleApiService.revokeAgencyAccess(fullDto);
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
    if (currentEntityUsers && currentEntityUsers.entityId && currentEntityUsers.service) {
      await this.loadEntityUsers({
        service: currentEntityUsers.service as GoogleServiceType,
        entityId: currentEntityUsers.entityId
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
      accessToken: null,
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
