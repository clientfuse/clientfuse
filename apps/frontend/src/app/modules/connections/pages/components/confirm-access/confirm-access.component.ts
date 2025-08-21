import { CommonModule } from '@angular/common';
import { Component, effect, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatAccordion, MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle } from '@angular/material/expansion';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import {
  FacebookAdAccount,
  FacebookBusinessAccount,
  FacebookCatalog,
  FacebookPage,
  IAgencyResponse,
  IGoogleAdsAccount,
  TAccessType,
  TFacebookAccessLinkKeys,
  TGoogleAccessLinkKeys,
  TPlatformNamesKeys
} from '@clientfuse/models';
import { analytics_v3, content_v2_1, mybusinessbusinessinformation_v1, searchconsole_v1, tagmanager_v2 } from 'googleapis';
import { GOOGLE_ICON_PATHS } from '../../../../../utils/icon.utils';
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
    RequestDetailsComponent
  ],
  templateUrl: './confirm-access.component.html',
  styleUrl: './confirm-access.component.scss'
})
export class ConfirmAccessComponent {
  readonly connectionSettings = input.required<IAgencyResponse | null>();
  readonly accessType = input.required<TAccessType>();
  readonly enabledGoogleServicesNames = input<TGoogleAccessLinkKeys[]>([]);
  readonly enabledFacebookServicesNames = input<TFacebookAccessLinkKeys[]>([]);
  readonly servicesEffect = effect(() => {
    this.initializeServicePanels();
  });


  readonly googleIcons = GOOGLE_ICON_PATHS;
  servicePanels: ServicePanel[] = [];

  // Mock data for Google services using googleapis types
  mockGoogleAdsAccounts: IGoogleAdsAccount[] = [
    {
      id: '1234567890',
      name: 'Connected Test Account',
      hasNoPermissions: false,
      customerId: '1234567890',
      currencyCode: 'USD',
      timeZone: 'America/New_York',
      _id: '1'
    }
  ];

  mockAnalyticsAccounts: analytics_v3.Schema$Account[] = [
    {
      id: 'analytics_123',
      name: 'Test Analytics Account',
      kind: 'analytics#account',
      selfLink: 'https://www.googleapis.com/analytics/v3/management/accounts/analytics_123',
      created: '2024-01-01T00:00:00.000Z',
      updated: '2024-01-01T00:00:00.000Z'
    }
  ];

  mockSearchConsoleSites: searchconsole_v1.Schema$WmxSite[] = [
    {
      siteUrl: 'https://profitkit.io',
      permissionLevel: 'siteFullUser'
    }
  ];

  mockTagManagerAccounts: tagmanager_v2.Schema$Account[] = [
    {
      accountId: 'gtm_123',
      name: 'Test Tag Manager Account',
      path: 'accounts/gtm_123',
      fingerprint: '1234567890'
    }
  ];

  mockMerchantCenterAccounts: content_v2_1.Schema$AccountIdentifier[] = [
    {
      merchantId: '123456789',
      aggregatorId: '987654321'
    }
  ];

  mockBusinessLocations: mybusinessbusinessinformation_v1.Schema$Location[] = [
    {
      name: 'locations/loc_123',
      title: 'Test Business Location',
      storeCode: 'STORE001',
      languageCode: 'en'
    }
  ];

  // Mock data for Facebook services
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

    // Add Google service panels
    const googleServices = this.enabledGoogleServicesNames();
    if (googleServices.includes('ads')) {
      panels.push({
        key: 'googleAds',
        name: 'Google Ads Account',
        iconPath: this.googleIcons.ads,
        expanded: panels.length === 0,
        provider: 'google',
        accounts: this.mockGoogleAdsAccounts,
        selectedAccount: '',
        noAccountsMessage: 'No Ads Account found.'
      });
    }

    if (googleServices.includes('analytics')) {
      panels.push({
        key: 'googleAnalytics',
        name: 'Analytics Account',
        iconPath: this.googleIcons.analytics,
        expanded: false,
        provider: 'google',
        accounts: this.mockAnalyticsAccounts,
        selectedAccount: '',
        noAccountsMessage: 'No Analytics Account found.'
      });
    }

    if (googleServices.includes('searchConsole')) {
      panels.push({
        key: 'googleSearchConsole',
        name: 'Search Console',
        iconPath: this.googleIcons.searchConsole,
        expanded: false,
        provider: 'google',
        accounts: this.mockSearchConsoleSites,
        selectedAccount: '',
        noAccountsMessage: 'No Search Console found.'
      });
    }

    if (googleServices.includes('tagManager')) {
      panels.push({
        key: 'googleTagManager',
        name: 'Google Tag Manager',
        iconPath: this.googleIcons.tagManager,
        expanded: false,
        provider: 'google',
        accounts: this.mockTagManagerAccounts,
        selectedAccount: '',
        noAccountsMessage: 'No Tag Manager found.'
      });
    }

    if (googleServices.includes('merchantCenter')) {
      panels.push({
        key: 'googleMerchantCenter',
        name: 'Google Merchant Center',
        iconPath: this.googleIcons.merchantCenter,
        expanded: false,
        provider: 'google',
        accounts: this.mockMerchantCenterAccounts,
        selectedAccount: '',
        noAccountsMessage: 'No Merchant Center found.'
      });
    }

    if (googleServices.includes('myBusiness')) {
      panels.push({
        key: 'googleMyBusiness',
        name: 'Google Business Profile Location',
        iconPath: this.googleIcons.myBusiness,
        expanded: false,
        provider: 'google',
        accounts: this.mockBusinessLocations,
        selectedAccount: '',
        noAccountsMessage: 'No Business Profile Location found.'
      });
    }

    // Add Facebook service panels
    const facebookServices = this.enabledFacebookServicesNames();
    if (facebookServices.includes('ads')) {
      panels.push({
        key: 'facebookAds',
        name: 'Meta Ads Account',
        expanded: panels.length === 0,
        provider: 'facebook',
        accounts: this.mockFacebookAdsAccounts,
        selectedAccount: '',
        noAccountsMessage: 'No Meta Ads Account found.'
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
        noAccountsMessage: 'No Meta Business Account found.'
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
        noAccountsMessage: 'No Meta Pages found.'
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
        noAccountsMessage: 'No Meta Catalogs found.'
      });
    }

    this.servicePanels = panels;
  }

  getAccountValue(account: any, panel: ServicePanel): string {
    // Google specific
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

    // Facebook specific
    if (panel.provider === 'facebook' && panel.key === 'facebookAds') {
      return (account as FacebookAdAccount).account_id;
    }

    // Default for entities with id
    return account.id || '';
  }

  getAccountDisplayName(account: any, panel: ServicePanel): string {
    // Google specific
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

    // Facebook specific
    if (panel.provider === 'facebook') {
      return account.name || 'Account';
    }

    // Default for entities with name
    return account.name || 'Account';
  }

  getAccountDetails(account: any, panel: ServicePanel): string {
    // Google specific
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

    // Facebook specific
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

  confirmAccess() {
    const selectedAccounts: Record<string, string> = {};
    this.servicePanels.forEach(panel => {
      if (panel.selectedAccount) {
        selectedAccounts[panel.key] = panel.selectedAccount;
      }
    });

    console.log('Confirmed access for accounts:', selectedAccounts);
  }
}
