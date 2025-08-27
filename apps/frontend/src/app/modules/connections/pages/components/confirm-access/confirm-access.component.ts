import { CommonModule } from '@angular/common';
import { Component, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatAccordion, MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle } from '@angular/material/expansion';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import {
  FacebookAdAccount,
  FacebookBusinessAccount,
  FacebookCatalog,
  FacebookPage,
  GoogleServiceType,
  IAgencyResponse,
  IGoogleAdsAccount,
  TAccessType,
  TFacebookAccessLinkKeys,
  TGoogleAccessLinkKeys,
  TPlatformNamesKeys
} from '@clientfuse/models';
import { analytics_v3, content_v2_1, mybusinessbusinessinformation_v1, searchconsole_v1, tagmanager_v2 } from 'googleapis';
import { IslandComponent } from '../../../../../components/island/island.component';
import { GoogleStoreService } from '../../../../../services/google/google-store.service';
import { SnackbarService } from '../../../../../services/snackbar.service';
import { GOOGLE_ICON_PATHS } from '../../../../../utils/icon.utils';
import { InstructionStepComponent } from '../instruction-step/instruction-step.component';
import { RequestDetailsComponent } from '../request-details/request-details.component';

interface ServicePanel {
  key: string;
  name: string;
  iconPath?: string;
  expanded: boolean;
  provider: TPlatformNamesKeys;
  accounts: any[];
  selectedAccount: string;
  noAccountsMessage: string;
  existingUsers?: Map<string, string[]>;
  loadingUsers?: Set<string>;
}

@Component({
  selector: 'app-confirm-access',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatAccordion,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    MatRadioButton,
    MatRadioGroup,
    MatButton,
    RequestDetailsComponent,
    IslandComponent,
    InstructionStepComponent
  ],
  templateUrl: './confirm-access.component.html',
  styleUrl: './confirm-access.component.scss'
})
export class ConfirmAccessComponent {
  private readonly googleStoreService = inject(GoogleStoreService);
  private readonly snackbarService = inject(SnackbarService);

  readonly connectionSettings = input.required<IAgencyResponse | null>();
  readonly accessType = input.required<TAccessType>();
  readonly enabledGoogleServicesNames = input<TGoogleAccessLinkKeys[]>([]);
  readonly enabledFacebookServicesNames = input<TFacebookAccessLinkKeys[]>([]);

  private isInitializingPanels = false;
  readonly servicesEffect = effect(() => {
    // Read the signals to track changes
    const connectionData = this.googleStoreService.connectionData();
    const googleServices = this.enabledGoogleServicesNames();
    const facebookServices = this.enabledFacebookServicesNames();

    if (!this.isInitializingPanels) {
      this.isInitializingPanels = true;
      setTimeout(() => {
        this.initializeServicePanels();
        this.isInitializingPanels = false;
      }, 0);
    }
  }, { allowSignalWrites: true });


  readonly googleIcons = GOOGLE_ICON_PATHS;
  servicePanels: ServicePanel[] = [];
  readonly entityUsersCache = signal<Map<string, { users: string[]; timestamp: number }>>(new Map());

  mockFacebookAdsAccounts: FacebookAdAccount[] = [
    {
      id: 'act_123456789',
      name: 'Test Ad Account',
      account_id: '123456789',
      currency: 'USD',
      timezone_name: 'America/New_York',
      account_status: 1,
      created_time: '2024-01-01'
    }
  ];

  mockFacebookBusinessAccounts: FacebookBusinessAccount[] = [
    {
      id: '987654321',
      name: 'Test Business',
      verification_status: 'verified',
      created_time: '2024-01-01',
      updated_time: '2024-01-01',
      business_type: 'Technology'
    }
  ];

  mockFacebookPages: FacebookPage[] = [
    {
      id: 'page_123',
      name: 'Test Page',
      category: 'Business',
      category_list: [{ id: '1', name: 'Business' }],
      fan_count: 100
    }
  ];

  mockFacebookCatalogs: FacebookCatalog[] = [
    {
      id: 'catalog_123',
      name: 'Test Catalog',
      business_id: '987654321',
      product_count: 50,
      created_time: '2024-01-01',
      updated_time: '2024-01-01'
    }
  ];

  private initializeServicePanels() {
    const panels: ServicePanel[] = [];
    const connectionData = this.googleStoreService.connectionData();

    const googleServices = this.enabledGoogleServicesNames();
    if (googleServices.includes('ads')) {
      panels.push({
        key: 'googleAds',
        name: 'Google Ads Account',
        iconPath: this.googleIcons.ads,
        expanded: panels.length === 0,
        provider: 'google',
        accounts: connectionData?.accounts?.googleAdsAccounts || [],
        selectedAccount: '',
        noAccountsMessage: 'No Ads Account found.',
        existingUsers: new Map(),
        loadingUsers: new Set()
      });
    }

    if (googleServices.includes('analytics')) {
      panels.push({
        key: 'googleAnalytics',
        name: 'Analytics Account',
        iconPath: this.googleIcons.analytics,
        expanded: false,
        provider: 'google',
        accounts: connectionData?.accounts?.googleAnalyticsAccounts || [],
        selectedAccount: '',
        noAccountsMessage: 'No Analytics Account found.',
        existingUsers: new Map(),
        loadingUsers: new Set()
      });
    }

    if (googleServices.includes('searchConsole')) {
      panels.push({
        key: 'googleSearchConsole',
        name: 'Search Console',
        iconPath: this.googleIcons.searchConsole,
        expanded: false,
        provider: 'google',
        accounts: connectionData?.accounts?.googleSearchConsoles || [],
        selectedAccount: '',
        noAccountsMessage: 'No Search Console found.',
        existingUsers: new Map(),
        loadingUsers: new Set()
      });
    }

    if (googleServices.includes('tagManager')) {
      panels.push({
        key: 'googleTagManager',
        name: 'Google Tag Manager',
        iconPath: this.googleIcons.tagManager,
        expanded: false,
        provider: 'google',
        accounts: connectionData?.accounts?.googleTagManagers || [],
        selectedAccount: '',
        noAccountsMessage: 'No Tag Manager found.',
        existingUsers: new Map(),
        loadingUsers: new Set()
      });
    }

    if (googleServices.includes('merchantCenter')) {
      panels.push({
        key: 'googleMerchantCenter',
        name: 'Google Merchant Center',
        iconPath: this.googleIcons.merchantCenter,
        expanded: false,
        provider: 'google',
        accounts: connectionData?.accounts?.googleMerchantCenters || [],
        selectedAccount: '',
        noAccountsMessage: 'No Merchant Center found.',
        existingUsers: new Map(),
        loadingUsers: new Set()
      });
    }

    if (googleServices.includes('myBusiness')) {
      panels.push({
        key: 'googleMyBusiness',
        name: 'Google Business Profile Location',
        iconPath: this.googleIcons.myBusiness,
        expanded: false,
        provider: 'google',
        accounts: connectionData?.accounts?.googleMyBusinessLocations || [],
        selectedAccount: '',
        noAccountsMessage: 'No Business Profile Location found.',
        existingUsers: new Map(),
        loadingUsers: new Set()
      });
    }

    const facebookServices = this.enabledFacebookServicesNames();
    if (facebookServices.includes('ads')) {
      panels.push({
        key: 'facebookAds',
        name: 'Meta Ads Account',
        expanded: panels.length === 0,
        provider: 'facebook',
        accounts: this.mockFacebookAdsAccounts,
        selectedAccount: '',
        noAccountsMessage: 'No Meta Ads Account found.',
        existingUsers: new Map(),
        loadingUsers: new Set()
      });
    }

    if (facebookServices.includes('business')) {
      panels.push({
        key: 'facebookBusiness',
        name: 'Meta Business Account',
        expanded: false,
        provider: 'facebook',
        accounts: this.mockFacebookBusinessAccounts,
        selectedAccount: '',
        noAccountsMessage: 'No Meta Business Account found.',
        existingUsers: new Map(),
        loadingUsers: new Set()
      });
    }

    if (facebookServices.includes('pages')) {
      panels.push({
        key: 'facebookPages',
        name: 'Meta Pages',
        expanded: false,
        provider: 'facebook',
        accounts: this.mockFacebookPages,
        selectedAccount: '',
        noAccountsMessage: 'No Meta Pages found.',
        existingUsers: new Map(),
        loadingUsers: new Set()
      });
    }

    if (facebookServices.includes('catalogs')) {
      panels.push({
        key: 'facebookCatalogs',
        name: 'Meta Catalogs',
        expanded: false,
        provider: 'facebook',
        accounts: this.mockFacebookCatalogs,
        selectedAccount: '',
        noAccountsMessage: 'No Meta Catalogs found.',
        existingUsers: new Map(),
        loadingUsers: new Set()
      });
    }

    this.servicePanels = panels;

    panels.forEach(panel => {
      if (panel.accounts.length > 0 && panel.provider === 'google') {
        panel.accounts.forEach(async account => {
          const accountValue = this.getAccountValue(account, panel);
          if (accountValue) {
            await this.checkAccountUsers(panel, accountValue);
          }
        });
      }
    });
  }

  getAccountValue(account: any, panel: ServicePanel): string {
    if (panel.key === 'googleAds') {
      return (account as IGoogleAdsAccount).customerId || (account as IGoogleAdsAccount).id;
    }
    if (panel.key === 'googleAnalytics') {
      return (account as analytics_v3.Schema$Account).id || '';
    }
    if (panel.key === 'googleSearchConsole') {
      return (account as searchconsole_v1.Schema$WmxSite).siteUrl || '';
    }
    if (panel.key === 'googleTagManager') {
      return (account as tagmanager_v2.Schema$Account).accountId || '';
    }
    if (panel.key === 'googleMerchantCenter') {
      return String((account as content_v2_1.Schema$AccountIdentifier).merchantId || '');
    }
    if (panel.key === 'googleMyBusiness') {
      return (account as mybusinessbusinessinformation_v1.Schema$Location).name || '';
    }

    if (panel.provider === 'facebook' && panel.key === 'facebookAds') {
      return (account as FacebookAdAccount).account_id;
    }

    return account.id || '';
  }

  getAccountDisplayName(account: any, panel: ServicePanel): string {
    if (panel.key === 'googleAds') {
      return (account as IGoogleAdsAccount).name;
    }
    if (panel.key === 'googleAnalytics') {
      return (account as analytics_v3.Schema$Account).name || 'Analytics Account';
    }
    if (panel.key === 'googleSearchConsole') {
      return (account as searchconsole_v1.Schema$WmxSite).siteUrl || '';
    }
    if (panel.key === 'googleTagManager') {
      return (account as tagmanager_v2.Schema$Account).name || 'Tag Manager Account';
    }
    if (panel.key === 'googleMerchantCenter') {
      return `Merchant Account ${(account as content_v2_1.Schema$AccountIdentifier).merchantId}`;
    }
    if (panel.key === 'googleMyBusiness') {
      return (account as mybusinessbusinessinformation_v1.Schema$Location).title || 'Business Location';
    }

    if (panel.provider === 'facebook') {
      return account.name || 'Account';
    }

    return account.name || 'Account';
  }

  getAccountDetails(account: any, panel: ServicePanel): string {
    if (panel.key === 'googleAds') {
      const adsAccount = account as IGoogleAdsAccount;
      return `${adsAccount.customerId || adsAccount.id} • ${adsAccount.currencyCode}`;
    }
    if (panel.key === 'googleAnalytics') {
      return (account as analytics_v3.Schema$Account).id || '';
    }
    if (panel.key === 'googleSearchConsole') {
      return (account as searchconsole_v1.Schema$WmxSite).permissionLevel || '';
    }
    if (panel.key === 'googleTagManager') {
      return (account as tagmanager_v2.Schema$Account).accountId || '';
    }
    if (panel.key === 'googleMerchantCenter') {
      const merchant = account as content_v2_1.Schema$AccountIdentifier;
      return `ID: ${merchant.merchantId}${merchant.aggregatorId ? ` • Aggregator: ${merchant.aggregatorId}` : ''}`;
    }
    if (panel.key === 'googleMyBusiness') {
      const location = account as mybusinessbusinessinformation_v1.Schema$Location;
      return location.storeCode ? `${location.name} • ${location.storeCode}` : location.name || '';
    }

    if (panel.key === 'facebookAds') {
      const adAccount = account as FacebookAdAccount;
      return `${adAccount.account_id} • ${adAccount.currency}`;
    }
    if (panel.key === 'facebookBusiness') {
      const businessAccount = account as FacebookBusinessAccount;
      return `${businessAccount.id} • ${businessAccount.business_type || 'Business'}`;
    }
    if (panel.key === 'facebookPages') {
      const page = account as FacebookPage;
      return `${page.id} • ${page.category || 'Page'}`;
    }
    if (panel.key === 'facebookCatalogs') {
      const catalog = account as FacebookCatalog;
      return `${catalog.id} • ${catalog.product_count} products`;
    }

    return account.id || '';
  }

  googleServicePanels(): ServicePanel[] {
    return this.servicePanels.filter(panel => panel.provider === 'google');
  }

  metaServicePanels(): ServicePanel[] {
    return this.servicePanels.filter(panel => panel.provider === 'facebook');
  }

  hasGoogleServices(): boolean {
    return this.enabledGoogleServicesNames().length > 0;
  }

  hasMetaServices(): boolean {
    return this.enabledFacebookServicesNames().length > 0;
  }

  isLoading(): boolean {
    return this.googleStoreService.isLoading();
  }

  getGrantButtonText(): string {
    const accessType = this.accessType();
    return accessType === 'manage' ? 'Grant Manage Access' : 'Grant View Access';
  }

  async grantAccess(panel: ServicePanel): Promise<void> {
    if (!panel.selectedAccount) {
      this.snackbarService.warn('Please select an account first');
      return;
    }

    const accessType = this.accessType();
    const agencyEmail = this.connectionSettings()?.email || '';

    if (panel.provider === 'google') {
      const service = this.mapPanelKeyToServiceType(panel.key);
      if (!service) {
        this.snackbarService.error('Unknown service type');
        return;
      }

      const dto = {
        service: service,
        entityId: panel.selectedAccount,
        agencyEmail: agencyEmail
      };

      try {
        let response;
        if (accessType === 'manage') {
          response = await this.googleStoreService.grantManagementAccess(dto);
        } else {
          response = await this.googleStoreService.grantViewAccess(dto);
        }

        if (response) {
          const accessTypeText = accessType === 'manage' ? 'Management' : 'View';
          this.snackbarService.success(
            `${accessTypeText} access granted successfully for ${panel.name}`
          );

          // Update the existing users list to include the agency email
          if (panel.existingUsers) {
            const currentUsers = panel.existingUsers.get(panel.selectedAccount) || [];
            if (!currentUsers.some(email => email.toLowerCase() === agencyEmail.toLowerCase())) {
              panel.existingUsers.set(panel.selectedAccount, [...currentUsers, agencyEmail]);
            }
          }

          // Update the cache
          const cacheKey = `${panel.key}_${panel.selectedAccount}`;
          const updatedCache = new Map(this.entityUsersCache());
          const cachedEntry = updatedCache.get(cacheKey);
          if (cachedEntry) {
            if (!cachedEntry.users.some(email => email.toLowerCase() === agencyEmail.toLowerCase())) {
              cachedEntry.users.push(agencyEmail);
            }
            updatedCache.set(cacheKey, {
              users: cachedEntry.users,
              timestamp: Date.now()
            });
          } else {
            updatedCache.set(cacheKey, {
              users: [agencyEmail],
              timestamp: Date.now()
            });
          }
          this.entityUsersCache.set(updatedCache);

          panel.selectedAccount = '';
        } else {
          const errorMessage = this.googleStoreService.error();
          if (errorMessage) {
            this.snackbarService.error(errorMessage);
          }
        }
      } catch (error: any) {
        console.error('Failed to grant access:', error);
        const errorMessage = error?.error?.message || error?.message ||
          'An error occurred while granting access. Please try again later.';
        this.snackbarService.error(errorMessage);
      }
    } else {
      this.snackbarService.info('Facebook/Meta access grant will be available soon');
    }
  }

  async onAccountSelectionChange(panel: ServicePanel, accountValue: string): Promise<void> {
    panel.selectedAccount = accountValue;
    await this.checkAccountUsers(panel, accountValue);
  }

  async checkAccountUsers(panel: ServicePanel, accountValue: string): Promise<void> {
    if (!accountValue || panel.provider !== 'google') {
      return;
    }

    const cacheKey = `${panel.key}_${accountValue}`;
    const cached = this.entityUsersCache();
    const cachedEntry = cached.get(cacheKey);

    const CACHE_DURATION = 5 * 60 * 1000;
    if (cachedEntry && (Date.now() - cachedEntry.timestamp) < CACHE_DURATION) {
      panel.existingUsers?.set(accountValue, cachedEntry.users);
      return;
    }

    const service = this.mapPanelKeyToServiceType(panel.key);
    if (!service) {
      return;
    }

    panel.loadingUsers?.add(accountValue);

    try {
      await this.googleStoreService.loadEntityUsers({
        service: service,
        entityId: accountValue
      });

      const entityUsers = this.googleStoreService.entityUsers();
      if (entityUsers && entityUsers.users) {
        const userEmails = entityUsers.users.map(user => user.email);
        panel.existingUsers?.set(accountValue, userEmails);

        const updatedCache = new Map(this.entityUsersCache());
        updatedCache.set(cacheKey, {
          users: userEmails,
          timestamp: Date.now()
        });
        this.entityUsersCache.set(updatedCache);
      }
    } catch (error) {
      console.error('Failed to load entity users:', error);
    } finally {
      panel.loadingUsers?.delete(accountValue);
    }
  }

  isAccountDisabled(panel: ServicePanel, accountValue: string): boolean {
    const agencyEmail = this.connectionSettings()?.email?.toLowerCase() || '';
    const existingUsers = panel.existingUsers?.get(accountValue) || [];
    return existingUsers.some(email => email.toLowerCase() === agencyEmail);
  }

  getAlreadyConnectedText(panel: ServicePanel, accountValue: string): string {
    const agencyEmail = this.connectionSettings()?.email || '';
    return `The agency ${agencyEmail} already has access to this account`;
  }

  isLoadingUsers(panel: ServicePanel, accountValue: string): boolean {
    return panel.loadingUsers?.has(accountValue) || false;
  }

  private mapPanelKeyToServiceType(key: string): GoogleServiceType | null {
    const mapping: Record<string, GoogleServiceType> = {
      'googleAds': 'ads',
      'googleAnalytics': 'analytics',
      'googleSearchConsole': 'searchConsole',
      'googleTagManager': 'tagManager',
      'googleMerchantCenter': 'merchantCenter',
      'googleMyBusiness': 'myBusiness'
    };
    return mapping[key] || null;
  }
}
