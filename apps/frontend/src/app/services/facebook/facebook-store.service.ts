import { computed, inject, Injectable, signal } from '@angular/core';
import {
  EMPTY_FACEBOOK_INFO,
  FacebookServiceType,
  IFacebookConnectionDto,
  IFacebookConnectionResponse,
  IGetEntityUsersQueryDto,
  IGetEntityUsersResponse,
  IGrantAccessResponse,
  IGrantAgencyAccessDto,
  IRevokeAccessResponse,
  IRevokeAgencyAccessDto
} from '@clientfuse/models';
import { AgencyStoreService } from '../agency/agency-store.service';
import { ConnectionLinkStoreService } from '../connection-link/connection-link-store.service';
import { ConnectionResultStoreService } from '../connection-result/connection-result-store.service';
import { ProfileStoreService } from '../profile/profile-store.service';
import { FacebookApiService } from './facebook-api.service';

export interface FacebookStoreState {
  connectionData: IFacebookConnectionResponse | null;
  entityUsers: IGetEntityUsersResponse | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class FacebookStoreService {
  private facebookApiService = inject(FacebookApiService);
  private connectionResultStore = inject(ConnectionResultStoreService);
  private profileStoreService = inject(ProfileStoreService);
  private agencyStoreService = inject(AgencyStoreService);
  private connectionLinkStoreService = inject(ConnectionLinkStoreService);

  private state = signal<FacebookStoreState>({
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

  async connectFacebookExternal(dto: IFacebookConnectionDto): Promise<void> {
    this.setLoading(true);
    this.clearError();

    try {
      const response = await this.facebookApiService.connectFacebookExternal(dto);
      if (response.payload) {
        this.state.update(state => ({
          ...state,
          connectionData: response.payload,
          accessToken: dto.accessToken
        }));
      } else {
        this.setError('Failed to connect Facebook account');
      }
    } catch (error) {
      this.setError('An error occurred while connecting Facebook account');
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
      this.setError('User must be authenticated with Facebook');
      this.setLoading(false);
      return null;
    }

    try {
      const fullDto = {
        ...dto,
        accessToken
      } as IGrantAgencyAccessDto;

      const response = await this.facebookApiService.grantManagementAccess(fullDto);
      if (response.payload) {
        await this.connectionResultStore.addGrantedAccess('facebook', response.payload);
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
      this.setError('User must be authenticated with Facebook');
      this.setLoading(false);
      return null;
    }

    try {
      const fullDto = {
        ...dto,
        accessToken
      } as IGrantAgencyAccessDto;

      const response = await this.facebookApiService.grantViewAccess(fullDto);
      if (response.payload) {
        await this.connectionResultStore.addGrantedAccess('facebook', response.payload);
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
    service: FacebookServiceType;
    entityId: string;
  }): Promise<void> {
    this.setLoading(true);
    this.clearError();

    const accessToken = this.state().accessToken;

    if (!accessToken) {
      this.setError('User must be authenticated with Facebook');
      this.setLoading(false);
      return;
    }

    try {
      const fullDto = {
        ...dto,
        accessToken
      } as IGetEntityUsersQueryDto & { service: FacebookServiceType; entityId: string };

      const response = await this.facebookApiService.getEntityUsers(fullDto);
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
      this.setError('User must be authenticated with Facebook');
      this.setLoading(false);
      return null;
    }

    try {
      const fullDto = {
        ...dto,
        accessToken
      } as IRevokeAgencyAccessDto;

      const response = await this.facebookApiService.revokeAgencyAccess(fullDto);
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
        service: currentEntityUsers.service as FacebookServiceType,
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

  async disconnectFacebookInternal(): Promise<void> {
    this.setLoading(true);
    this.clearError();

    try {
      const response = await this.facebookApiService.disconnectFacebookInternal();
      if (response.payload) {
        const profile = this.profileStoreService.profile();

        this.profileStoreService.updateProfile({
          facebook: EMPTY_FACEBOOK_INFO,
          isLoggedInWithFacebook: false
        });
        this.clearAll();

        // Reload connection links after disconnect
        if (profile?._id) {
          const agency = await this.agencyStoreService.getUserAgency(profile._id);
          if (agency?._id) {
            await this.connectionLinkStoreService.loadConnectionLinksForAgency(agency._id);
          }
        }
      } else {
        this.setError('Failed to disconnect Facebook account');
      }
    } catch (error) {
      this.setError('An error occurred while disconnecting Facebook account');
      throw error;
    } finally {
      this.setLoading(false);
    }
  }
}
