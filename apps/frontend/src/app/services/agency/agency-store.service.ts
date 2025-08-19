import { inject, Injectable, signal } from '@angular/core';
import { IAgencyBase, IAgencyResponse } from '@clientfuse/models';
import { AgencyApiService } from './agency-api.service';

@Injectable({
  providedIn: 'root'
})
export class AgencyStoreService {
  private agencyApiService = inject(AgencyApiService);
  private _agency = signal<IAgencyResponse | null>(null);
  agency = this._agency.asReadonly();

  async getUserAgency(userId: string) {
    try {
      const response = await this.agencyApiService.findAgencies({ userId: userId as any });
      const agency = response.payload[0] || null;
      this._agency.set(agency);
      return agency;
    } catch (error) {
      console.error('Error fetching user agency:', error);
      this._agency.set(null);
      return null;
    }
  }

  async updateAgency(id: string, updateAgencyDto: Partial<IAgencyBase>) {
    try {
      const response = await this.agencyApiService.updateAgency(id, updateAgencyDto);
      const updatedAgency = response.payload;
      this._agency.set(updatedAgency);
      return updatedAgency;
    } catch (error) {
      console.error('Error updating agency:', error);
      throw error;
    }
  }

}
