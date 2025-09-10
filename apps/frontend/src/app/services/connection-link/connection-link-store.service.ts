import { computed, inject, Injectable, signal } from '@angular/core';
import { TConnectionLinkBase, TConnectionLinkResponse } from '@clientfuse/models';
import { ConnectionLinkApiService } from './connection-link-api.service';

@Injectable({
  providedIn: 'root'
})
export class ConnectionLinkStoreService {
  private connectionLinkApiService = inject(ConnectionLinkApiService);

  private _connectionLinks = signal<TConnectionLinkResponse[]>([]);
  private _currentConnectionLink = signal<TConnectionLinkResponse | null>(null);

  connectionLinks = this._connectionLinks.asReadonly();
  currentConnectionLink = this._currentConnectionLink.asReadonly();
  defaultConnectionLink = computed(() =>
    this._connectionLinks().find(cl => cl.isDefault) || null
  );

  async loadConnectionLinksForAgency(agencyId: string): Promise<TConnectionLinkResponse[]> {
    try {
      const response = await this.connectionLinkApiService.findConnectionLinks({ agencyId });
      const connectionLinks = response.payload;
      this._connectionLinks.set(connectionLinks);
      return connectionLinks;
    } catch (error) {
      console.error('Error loading connection links:', error);
      this._connectionLinks.set([]);
      return [];
    }
  }

  async loadConnectionLink(id: string): Promise<TConnectionLinkResponse | null> {
    try {
      const response = await this.connectionLinkApiService.findConnectionLink(id);
      const connectionLink = response.payload;
      this._currentConnectionLink.set(connectionLink);

      const links = this._connectionLinks();
      const index = links.findIndex(cl => cl._id === id);
      if (index !== -1) {
        const updatedLinks = [...links];
        updatedLinks[index] = connectionLink;
        this._connectionLinks.set(updatedLinks);
      }

      return connectionLink;
    } catch (error) {
      console.error('Error loading connection link:', error);
      this._currentConnectionLink.set(null);
      return null;
    }
  }

  async updateConnectionLink(id: string, data: Partial<TConnectionLinkBase>): Promise<TConnectionLinkResponse> {
    try {
      const response = await this.connectionLinkApiService.updateConnectionLink(id, data);
      const updatedConnectionLink = response.payload;

      const links = this._connectionLinks();
      const index = links.findIndex(cl => cl._id === id);
      if (index !== -1) {
        const updatedLinks = [...links];
        updatedLinks[index] = updatedConnectionLink;
        this._connectionLinks.set(updatedLinks);
      }

      if (this._currentConnectionLink()?._id === id) {
        this._currentConnectionLink.set(updatedConnectionLink);
      }

      return updatedConnectionLink;
    } catch (error) {
      console.error('Error updating connection link:', error);
      throw error;
    }
  }

  async createConnectionLink(data: TConnectionLinkBase): Promise<TConnectionLinkResponse> {
    try {
      const response = await this.connectionLinkApiService.createConnectionLink(data);
      const newConnectionLink = response.payload;

      const links = this._connectionLinks();
      this._connectionLinks.set([...links, newConnectionLink]);

      return newConnectionLink;
    } catch (error) {
      console.error('Error creating connection link:', error);
      throw error;
    }
  }

  async deleteConnectionLink(id: string): Promise<void> {
    try {
      await this.connectionLinkApiService.deleteConnectionLink(id);

      const links = this._connectionLinks();
      this._connectionLinks.set(links.filter(cl => cl._id !== id));

      if (this._currentConnectionLink()?._id === id) {
        this._currentConnectionLink.set(null);
      }
    } catch (error) {
      console.error('Error deleting connection link:', error);
      throw error;
    }
  }

  async setAsDefault(id: string): Promise<TConnectionLinkResponse> {
    try {
      const response = await this.connectionLinkApiService.setAsDefault(id);
      const updatedConnectionLink = response.payload;

      const links = this._connectionLinks();
      const updatedLinks = links.map(cl => ({
        ...cl,
        isDefault: cl._id === id
      }));
      this._connectionLinks.set(updatedLinks);

      if (this._currentConnectionLink()?._id === id) {
        this._currentConnectionLink.set(updatedConnectionLink);
      }

      return updatedConnectionLink;
    } catch (error) {
      console.error('Error setting as default connection link:', error);
      throw error;
    }
  }

  clearAll(): void {
    this._connectionLinks.set([]);
    this._currentConnectionLink.set(null);
  }
}
