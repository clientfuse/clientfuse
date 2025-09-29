import { CommonModule } from '@angular/common';
import { Component, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatAccordion, MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import {
  FacebookAdAccount,
  FacebookCatalog,
  FacebookPage,
  FacebookPixel,
  FacebookServiceType,
  GoogleServiceType,
  IGoogleAdsAccount,
  TAccessType,
  TConnectionLinkResponse,
  TFacebookAccessLinkKeys,
  TGoogleAccessLinkKeys,
  TPlatformNamesKeys
} from '@clientfuse/models';
import { analytics_v3, content_v2_1, mybusinessbusinessinformation_v1, searchconsole_v1, tagmanager_v2 } from 'googleapis';
import { firstValueFrom } from 'rxjs';
import { IslandComponent } from '../../../../../components/island/island.component';
import { ConnectionResultStoreService } from '../../../../../services/connection-result/connection-result-store.service';
import { DialogService } from '../../../../../services/dialog.service';
import { FacebookStoreService } from '../../../../../services/facebook/facebook-store.service';
import { GoogleStoreService } from '../../../../../services/google/google-store.service';
import { SnackbarService } from '../../../../../services/snackbar.service';
import { GOOGLE_ICON_PATHS } from '../../../../../utils/icon.utils';
import { InstructionStepComponent } from '../instruction-step/instruction-step.component';
import { FacebookAdsModalComponent, IFacebookAdsModalData } from '../modals/facebook-ads-modal/facebook-ads-modal.component';
import { FacebookPixelModalComponent, IFacebookPixelModalData } from '../modals/facebook-pixel-modal/facebook-pixel-modal.component';
import {
  GoogleAdsDomainModalComponent,
  IGoogleAdsDomainModalData
} from '../modals/google-ads-domain-modal/google-ads-domain-modal.component';
import {
  GoogleSearchConsoleModalComponent,
  IGoogleSearchConsoleModalData
} from '../modals/google-search-console-modal/google-search-console-modal.component';
import { RequestDetailsComponent } from '../request-details/request-details.component';

interface ServicePanel {
  key: GoogleServiceType | FacebookServiceType;
  name: string;
  iconPath?: string;
  expanded: boolean;
  provider: TPlatformNamesKeys;
  accounts: any[];
  selectedAccount: string;
  noAccountsMessage: string;
  existingUsers?: Map<string, string[]>;
  loadingUsers?: Set<string>;
  agencyIdentifier?: string; // Email for this specific service
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
    InstructionStepComponent,
    MatIconModule
  ],
  templateUrl: './confirm-access.component.html',
  styleUrl: './confirm-access.component.scss'
})
export class ConfirmAccessComponent {
  private readonly googleStoreService = inject(GoogleStoreService);
  private readonly facebookStoreService = inject(FacebookStoreService);
  private readonly connectionResultStore = inject(ConnectionResultStoreService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly dialogService = inject(DialogService);

  readonly connectionLink = input.required<TConnectionLinkResponse | null>();
  readonly agencyEmail = input<string>('');
  readonly accessType = input.required<TAccessType>();
  readonly enabledGoogleServicesNames = input<TGoogleAccessLinkKeys[]>([]);
  readonly enabledFacebookServicesNames = input<TFacebookAccessLinkKeys[]>([]);

  private isInitializingPanels = false;
  readonly servicesEffect = effect(() => {
    // Read the signals to track changes
    this.googleStoreService.connectionData();
    this.facebookStoreService.connectionData();
    this.enabledGoogleServicesNames();
    this.enabledFacebookServicesNames();

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

  private initializeServicePanels() {
    const panels: ServicePanel[] = [];
    const connectionData = this.googleStoreService.connectionData();
    const facebookConnectionData = this.facebookStoreService.connectionData();

    const googleServices = this.enabledGoogleServicesNames();
    if (googleServices.includes('googleAds')) {
      panels.push({
        key: GoogleServiceType.ADS,
        name: 'Google Ads Account',
        iconPath: this.googleIcons.googleAds,
        expanded: panels.length === 0,
        provider: 'google',
        accounts: connectionData?.accounts?.googleAdsAccounts || [],
        selectedAccount: '',
        noAccountsMessage: 'No Ads Account found.',
        existingUsers: new Map(),
        loadingUsers: new Set(),
        agencyIdentifier: this.connectionLink()?.google?.googleAds?.email
      });
    }

    if (googleServices.includes('googleAnalytics')) {
      panels.push({
        key: GoogleServiceType.ANALYTICS,
        name: 'Analytics Account',
        iconPath: this.googleIcons.googleAnalytics,
        expanded: false,
        provider: 'google',
        accounts: connectionData?.accounts?.googleAnalyticsAccounts || [],
        selectedAccount: '',
        noAccountsMessage: 'No Analytics Account found.',
        existingUsers: new Map(),
        loadingUsers: new Set(),
        agencyIdentifier: this.connectionLink()?.google?.googleAnalytics?.email
      });
    }

    if (googleServices.includes('googleSearchConsole')) {
      panels.push({
        key: GoogleServiceType.SEARCH_CONSOLE,
        name: 'Search Console',
        iconPath: this.googleIcons.googleSearchConsole,
        expanded: false,
        provider: 'google',
        accounts: connectionData?.accounts?.googleSearchConsoles || [],
        selectedAccount: '',
        noAccountsMessage: 'No Search Console found.',
        existingUsers: new Map(),
        loadingUsers: new Set(),
        agencyIdentifier: this.connectionLink()?.google?.googleSearchConsole?.email
      });
    }

    if (googleServices.includes('googleTagManager')) {
      panels.push({
        key: GoogleServiceType.TAG_MANAGER,
        name: 'Google Tag Manager',
        iconPath: this.googleIcons.googleTagManager,
        expanded: false,
        provider: 'google',
        accounts: connectionData?.accounts?.googleTagManagers || [],
        selectedAccount: '',
        noAccountsMessage: 'No Tag Manager found.',
        existingUsers: new Map(),
        loadingUsers: new Set(),
        agencyIdentifier: this.connectionLink()?.google?.googleTagManager?.email
      });
    }

    if (googleServices.includes('googleMerchantCenter')) {
      panels.push({
        key: GoogleServiceType.MERCHANT_CENTER,
        name: 'Google Merchant Center',
        iconPath: this.googleIcons.googleMerchantCenter,
        expanded: false,
        provider: 'google',
        accounts: connectionData?.accounts?.googleMerchantCenters || [],
        selectedAccount: '',
        noAccountsMessage: 'No Merchant Center found.',
        existingUsers: new Map(),
        loadingUsers: new Set(),
        agencyIdentifier: this.connectionLink()?.google?.googleMerchantCenter?.email
      });
    }

    if (googleServices.includes('googleMyBusiness')) {
      panels.push({
        key: GoogleServiceType.MY_BUSINESS,
        name: 'Google Business Profile',
        iconPath: this.googleIcons.googleMyBusiness,
        expanded: false,
        provider: 'google',
        accounts: connectionData?.accounts?.googleMyBusinessLocations || [],
        selectedAccount: '',
        noAccountsMessage: 'No Business Profile found.',
        existingUsers: new Map(),
        loadingUsers: new Set(),
        agencyIdentifier: this.connectionLink()?.google?.googleMyBusiness?.emailOrId
      });
    }

    const facebookServices = this.enabledFacebookServicesNames();
    if (facebookServices.includes('facebookAds')) {
      panels.push({
        key: FacebookServiceType.AD_ACCOUNT,
        name: 'Meta Ads Account',
        expanded: panels.length === 0,
        provider: 'facebook',
        accounts: facebookConnectionData?.accounts?.facebookAdAccounts || [],
        selectedAccount: '',
        noAccountsMessage: 'No Meta Ads Account found.',
        existingUsers: new Map(),
        loadingUsers: new Set(),
        agencyIdentifier: this.connectionLink()?.facebook?.facebookAds?.businessPortfolioId
      });
    }

    if (facebookServices.includes('facebookPages')) {
      panels.push({
        key: FacebookServiceType.PAGE,
        name: 'Meta Pages',
        expanded: false,
        provider: 'facebook',
        accounts: facebookConnectionData?.accounts?.facebookPages || [],
        selectedAccount: '',
        noAccountsMessage: 'No Meta Pages found.',
        existingUsers: new Map(),
        loadingUsers: new Set(),
        agencyIdentifier: this.connectionLink()?.facebook?.facebookPages?.businessPortfolioId
      });
    }

    if (facebookServices.includes('facebookCatalogs')) {
      panels.push({
        key: FacebookServiceType.CATALOG,
        name: 'Meta Catalogs',
        expanded: false,
        provider: 'facebook',
        accounts: facebookConnectionData?.accounts?.facebookCatalogs || [],
        selectedAccount: '',
        noAccountsMessage: 'No Meta Catalogs found.',
        existingUsers: new Map(),
        loadingUsers: new Set(),
        agencyIdentifier: this.connectionLink()?.facebook?.facebookCatalogs?.businessPortfolioId
      });
    }

    if (facebookServices.includes('facebookPixels')) {
      panels.push({
        key: FacebookServiceType.PIXEL,
        name: 'Meta Pixels',
        expanded: false,
        provider: 'facebook',
        accounts: facebookConnectionData?.accounts?.facebookPixels || [],
        selectedAccount: '',
        noAccountsMessage: 'No Meta Pixels found.',
        existingUsers: new Map(),
        loadingUsers: new Set(),
        agencyIdentifier: this.connectionLink()?.facebook?.facebookPixels?.businessPortfolioId
      });
    }

    this.servicePanels = panels;

    panels.forEach(panel => {
      if (panel.accounts.length > 0) {
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
    if (panel.provider === 'google') {
      return this.getGoogleAccountValue(account, panel);
    } else if (panel.provider === 'facebook') {
      return this.getFacebookAccountValue(account, panel);
    }
    return account.id || '';
  }

  private getGoogleAccountValue(account: any, panel: ServicePanel): string {
    switch (panel.key) {
      case GoogleServiceType.ADS:
        return (account as IGoogleAdsAccount).customerId || (account as IGoogleAdsAccount).id;
      case GoogleServiceType.ANALYTICS:
        return (account as analytics_v3.Schema$Account).id || '';
      case GoogleServiceType.SEARCH_CONSOLE:
        return (account as searchconsole_v1.Schema$WmxSite).siteUrl || '';
      case GoogleServiceType.TAG_MANAGER:
        return (account as tagmanager_v2.Schema$Account).accountId || '';
      case GoogleServiceType.MERCHANT_CENTER:
        return String((account as content_v2_1.Schema$AccountIdentifier).merchantId || '');
      case GoogleServiceType.MY_BUSINESS:
        return (account as mybusinessbusinessinformation_v1.Schema$Location).name || '';
      default:
        return account.id || '';
    }
  }

  private getFacebookAccountValue(account: any, panel: ServicePanel): string {
    switch (panel.key) {
      case FacebookServiceType.AD_ACCOUNT:
        return (account as FacebookAdAccount).account_id;
      case FacebookServiceType.PAGE:
        return (account as FacebookPage).id;
      case FacebookServiceType.CATALOG:
        return (account as FacebookCatalog).id;
      case FacebookServiceType.PIXEL:
        return (account as FacebookPixel).id;
      default:
        return account.id || account.account_id || '';
    }
  }

  getAccountDisplayName(account: any, panel: ServicePanel): string {
    if (panel.provider === 'google') {
      return this.getGoogleAccountDisplayName(account, panel);
    } else if (panel.provider === 'facebook') {
      return this.getFacebookAccountDisplayName(account, panel);
    }
    return account.name || 'Account';
  }

  private getGoogleAccountDisplayName(account: any, panel: ServicePanel): string {
    switch (panel.key) {
      case GoogleServiceType.ADS:
        return (account as IGoogleAdsAccount).name;
      case GoogleServiceType.ANALYTICS:
        return (account as analytics_v3.Schema$Account).name || 'Analytics Account';
      case GoogleServiceType.SEARCH_CONSOLE:
        return (account as searchconsole_v1.Schema$WmxSite).siteUrl || '';
      case GoogleServiceType.TAG_MANAGER:
        return (account as tagmanager_v2.Schema$Account).name || 'Tag Manager Account';
      case GoogleServiceType.MERCHANT_CENTER:
        return `Merchant Account ${(account as content_v2_1.Schema$AccountIdentifier).merchantId}`;
      case GoogleServiceType.MY_BUSINESS:
        return (account as mybusinessbusinessinformation_v1.Schema$Location).title || 'Business Location';
      default:
        return account.name || 'Account';
    }
  }

  private getFacebookAccountDisplayName(account: any, panel: ServicePanel): string {
    switch (panel.key) {
      case FacebookServiceType.AD_ACCOUNT:
        return (account as FacebookAdAccount).name || 'Ad Account';
      case FacebookServiceType.PAGE:
        return (account as FacebookPage).name || 'Page';
      case FacebookServiceType.CATALOG:
        return (account as FacebookCatalog).name || 'Catalog';
      case FacebookServiceType.PIXEL:
        return (account as FacebookPixel).name || 'Pixel';
      default:
        return account.name || 'Account';
    }
  }

  getAccountDetails(account: any, panel: ServicePanel): string {
    if (panel.provider === 'google') {
      return this.getGoogleAccountDetails(account, panel);
    } else if (panel.provider === 'facebook') {
      return this.getFacebookAccountDetails(account, panel);
    }
    return account.id || '';
  }

  private getGoogleAccountDetails(account: any, panel: ServicePanel): string {
    switch (panel.key) {
      case GoogleServiceType.ADS:
        const adsAccount = account as IGoogleAdsAccount;
        return `${adsAccount.customerId || adsAccount.id} • ${adsAccount.currencyCode}`;
      case GoogleServiceType.ANALYTICS:
        return (account as analytics_v3.Schema$Account).id || '';
      case GoogleServiceType.SEARCH_CONSOLE:
        return (account as searchconsole_v1.Schema$WmxSite).permissionLevel || '';
      case GoogleServiceType.TAG_MANAGER:
        return (account as tagmanager_v2.Schema$Account).accountId || '';
      case GoogleServiceType.MERCHANT_CENTER:
        const merchant = account as content_v2_1.Schema$AccountIdentifier;
        return `ID: ${merchant.merchantId}${merchant.aggregatorId ? ` • Aggregator: ${merchant.aggregatorId}` : ''}`;
      case GoogleServiceType.MY_BUSINESS:
        const location = account as mybusinessbusinessinformation_v1.Schema$Location;
        return location.storeCode ? `${location.name} • ${location.storeCode}` : location.name || '';
      default:
        return account.id || '';
    }
  }

  private getFacebookAccountDetails(account: any, panel: ServicePanel): string {
    switch (panel.key) {
      case FacebookServiceType.AD_ACCOUNT:
        const adAccount = account as FacebookAdAccount;
        return `${adAccount.account_id} • ${adAccount.currency}`;
      case FacebookServiceType.PAGE:
        const page = account as FacebookPage;
        return `${page.id} • ${page.category || 'Page'}`;
      case FacebookServiceType.CATALOG:
        const catalog = account as FacebookCatalog;
        return `${catalog.id} • ${catalog.product_count} products`;
      case FacebookServiceType.PIXEL:
        const pixel = account as FacebookPixel;
        return `${pixel.id}${pixel.last_fired_time ? ` • Last fired: ${new Date(pixel.last_fired_time).toLocaleDateString()}` : ''}`;
      default:
        return account.id || account.account_id || '';
    }
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
    return this.googleStoreService.isLoading() || this.facebookStoreService.isLoading();
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

    if (panel.provider === 'google') {
      await this.grantGoogleAccess(panel);
    } else if (panel.provider === 'facebook') {
      await this.grantFacebookAccess(panel);
    } else {
      this.snackbarService.error('Unknown provider type');
    }
  }

  private async grantGoogleAccess(panel: ServicePanel): Promise<void> {
    const accessType = this.accessType();
    const agencyEmail = panel.agencyIdentifier || this.agencyEmail() || '';

    if (panel.key === GoogleServiceType.ADS && agencyEmail && !agencyEmail.toLowerCase().endsWith('@gmail.com')) {
      const domain = agencyEmail.split('@')[1];
      const dialogRef = this.dialogService.open<GoogleAdsDomainModalComponent, IGoogleAdsDomainModalData>(
        GoogleAdsDomainModalComponent,
        { domain: domain }
      );
      const result = await firstValueFrom(dialogRef.afterClosed());
      if (!result) return;
    }

    if (panel.key === GoogleServiceType.SEARCH_CONSOLE) {
      const dialogRef = this.dialogService.open<GoogleSearchConsoleModalComponent, IGoogleSearchConsoleModalData>(
        GoogleSearchConsoleModalComponent,
        {
          domain: panel.selectedAccount,
          agencyEmail: agencyEmail,
          accessType: accessType,
          agencyId: this.connectionLink()?._id
        }
      );
      const result: boolean = await firstValueFrom(dialogRef.afterClosed());
      if (result) {
        this.updatePanelAfterGrant(panel, agencyEmail);
      }
      return;
    }

    const dto = {
      service: panel.key as GoogleServiceType,
      entityId: panel.selectedAccount,
      agencyIdentifier: agencyEmail
    };

    try {
      const response = accessType === 'manage'
        ? await this.googleStoreService.grantManagementAccess(dto)
        : await this.googleStoreService.grantViewAccess(dto);

      if (response) {
        const accessTypeText = accessType === 'manage' ? 'Management' : 'View';
        this.snackbarService.success(
          `${accessTypeText} access granted successfully for ${panel.name}`
        );
        this.updatePanelAfterGrant(panel, agencyEmail);
      } else {
        const errorMessage = this.googleStoreService.error();
        if (errorMessage) {
          this.snackbarService.error(errorMessage);
        }
      }
    } catch (error: any) {
      console.error('Failed to grant Google access:', error);
      const errorMessage = error?.error?.message || error?.message ||
        'An error occurred while granting access. Please try again later.';
      this.snackbarService.error(errorMessage);
    }
  }

  private async grantFacebookAccess(panel: ServicePanel): Promise<void> {
    const accessType = this.accessType();
    const agencyEmail = panel.agencyIdentifier || this.agencyEmail() || '';

    if (panel.key === FacebookServiceType.AD_ACCOUNT) {
      const adAccount = panel.accounts.find((a: FacebookAdAccount) => a.account_id === panel.selectedAccount);
      if (!adAccount) {
        this.snackbarService.error('Selected ad account not found');
        return;
      }

      const businessPortfolioId = this.connectionLink()?.facebook?.facebookAds?.businessPortfolioId || '';

      const dialogRef = this.dialogService.open<FacebookAdsModalComponent, IFacebookAdsModalData>(
        FacebookAdsModalComponent,
        {
          adAccountName: adAccount.name,
          adAccountId: adAccount.account_id,
          adAccountBusinessId: adAccount.business_id,
          businessPortfolioId: businessPortfolioId,
          accessType: accessType,
          agencyId: this.connectionLink()?._id
        }
      );

      const result = await firstValueFrom(dialogRef.afterClosed());
      if (result) {
        this.updatePanelAfterGrant(panel, businessPortfolioId);
      }
      return;
    }

    if (panel.key === FacebookServiceType.PIXEL) {
      const pixel = panel.accounts.find((p: FacebookPixel) => p.id === panel.selectedAccount);
      if (!pixel) {
        this.snackbarService.error('Selected pixel not found');
        return;
      }

      const businessPortfolioId = this.connectionLink()?.facebook?.facebookPixels?.businessPortfolioId || '';

      const dialogRef = this.dialogService.open<FacebookPixelModalComponent, IFacebookPixelModalData>(
        FacebookPixelModalComponent,
        {
          pixelName: pixel.name,
          pixelId: pixel.id,
          businessPortfolioId: businessPortfolioId,
          accessType: accessType,
          agencyId: this.connectionLink()?._id
        }
      );

      const result = await firstValueFrom(dialogRef.afterClosed());
      if (result) {
        this.updatePanelAfterGrant(panel, businessPortfolioId);
      }
      return;
    }

    const dto = {
      service: panel.key as FacebookServiceType,
      entityId: panel.selectedAccount,
      agencyIdentifier: agencyEmail
    };

    try {
      const response = accessType === 'manage'
        ? await this.facebookStoreService.grantManagementAccess(dto)
        : await this.facebookStoreService.grantViewAccess(dto);

      if (response) {
        const accessTypeText = accessType === 'manage' ? 'Management' : 'View';
        this.snackbarService.success(
          `${accessTypeText} access granted successfully for ${panel.name}`
        );
        this.updatePanelAfterGrant(panel, agencyEmail);
      } else {
        const errorMessage = this.facebookStoreService.error();
        if (errorMessage) {
          this.snackbarService.error(errorMessage);
        }
      }
    } catch (error: any) {
      console.error('Failed to grant Facebook access:', error);
      const errorMessage = error?.error?.message || error?.message ||
        'An error occurred while granting access. Please try again later.';
      this.snackbarService.error(errorMessage);
    }
  }

  private updatePanelAfterGrant(panel: ServicePanel, agencyEmail: string): void {
    if (panel.existingUsers) {
      const currentUsers = panel.existingUsers.get(panel.selectedAccount) || [];
      if (!currentUsers.some(email => email.toLowerCase() === agencyEmail.toLowerCase())) {
        panel.existingUsers.set(panel.selectedAccount, [...currentUsers, agencyEmail]);
      }
    }

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
  }

  async onAccountSelectionChange(panel: ServicePanel, accountValue: string): Promise<void> {
    panel.selectedAccount = accountValue;
    await this.checkAccountUsers(panel, accountValue);
  }

  async checkAccountUsers(panel: ServicePanel, accountValue: string): Promise<void> {
    if (!accountValue) {
      return;
    }

    const cacheKey = `${panel.key}_${accountValue}`;
    const cached = this.entityUsersCache();
    const cachedEntry = cached.get(cacheKey);

    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    if (cachedEntry && (Date.now() - cachedEntry.timestamp) < CACHE_DURATION) {
      panel.existingUsers?.set(accountValue, cachedEntry.users);
      return;
    }

    if (panel.provider === 'google') {
      await this.checkGoogleAccountUsers(panel, accountValue);
    } else if (panel.provider === 'facebook') {
      await this.checkFacebookAccountUsers(panel, accountValue);
    }
  }

  private async checkGoogleAccountUsers(panel: ServicePanel, accountValue: string): Promise<void> {
    panel.loadingUsers?.add(accountValue);

    try {
      await this.googleStoreService.loadEntityUsers({
        service: panel.key as GoogleServiceType,
        entityId: accountValue,
        agencyId: this.connectionLink()?._id
      });

      const entityUsers = this.googleStoreService.entityUsers();
      if (entityUsers && entityUsers.users) {
        const userEmails = entityUsers.users.map(user => user.email);
        this.updateAccountUsersCache(panel, accountValue, userEmails);
      }
    } catch (error) {
      console.error('Failed to load Google entity users:', error);
    } finally {
      panel.loadingUsers?.delete(accountValue);
    }
  }

  private async checkFacebookAccountUsers(panel: ServicePanel, accountValue: string): Promise<void> {
    panel.loadingUsers?.add(accountValue);

    try {
      await this.facebookStoreService.loadEntityUsers({
        service: panel.key as FacebookServiceType,
        entityId: accountValue
      });

      const entityUsers = this.facebookStoreService.entityUsers();
      if (entityUsers && entityUsers.users) {
        const userEmails = entityUsers.users.map(user => user.email);
        this.updateAccountUsersCache(panel, accountValue, userEmails);
      }
    } catch (error) {
      console.error('Failed to load Facebook entity users:', error);
    } finally {
      panel.loadingUsers?.delete(accountValue);
    }
  }

  private updateAccountUsersCache(panel: ServicePanel, accountValue: string, userEmails: string[]): void {
    panel.existingUsers?.set(accountValue, userEmails);

    const cacheKey = `${panel.key}_${accountValue}`;
    const updatedCache = new Map(this.entityUsersCache());
    updatedCache.set(cacheKey, {
      users: userEmails,
      timestamp: Date.now()
    });
    this.entityUsersCache.set(updatedCache);
  }

  isAccountDisabled(panel: ServicePanel, accountValue: string): boolean {
    const agencyEmail = (panel.agencyIdentifier || this.agencyEmail() || '').toLowerCase();
    const existingUsers = panel.existingUsers?.get(accountValue) || [];
    return existingUsers.some(email => email.toLowerCase() === agencyEmail);
  }

  getAlreadyConnectedText(panel?: ServicePanel): string {
    const agencyEmail = panel?.agencyIdentifier || this.agencyEmail() || '';
    return `The agency ${agencyEmail} already has access to this account`;
  }

  isLoadingUsers(panel: ServicePanel, accountValue: string): boolean {
    return panel.loadingUsers?.has(accountValue) || false;
  }
}
