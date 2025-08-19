import { computed, inject, Injectable, signal } from '@angular/core';
import { IAgencyResponse, PlatformNames } from '@clientfuse/models';
import { cloneDeep } from 'lodash';
import { AgencyApiService } from '../agency/agency-api.service';


@Injectable({
  providedIn: 'root'
})
export class ConnectionStoreService {
  private agencyApiService = inject(AgencyApiService);

  connectionSettings = signal<IAgencyResponse | null>(null);
  requestedPlatforms = computed<string[]>(() => {
    const settings = this.connectionSettings();
    const defaultAccessLink = cloneDeep(settings?.defaultAccessLink || { _id: '' });
    delete defaultAccessLink['_id'];
    return Object.keys(defaultAccessLink).map(key => PlatformNames[key as keyof typeof PlatformNames] || key);
  });


  async getConnectionSettings(agencyId: string) {
    const res = await this.agencyApiService.findAgency(agencyId);
    this.connectionSettings.set(res.payload);
    return res.payload;
  }
}
