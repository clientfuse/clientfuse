import { computed, inject, Injectable, signal } from '@angular/core';
import {
  TConnectionResultResponse,
  TPlatformNamesKeys,
  TAccessType,
  IConnectionResultFilterDto
} from '@clientfuse/models';
import { ConnectionResultApiService } from './connection-result-api.service';

export interface ConnectionResultFilters {
  platform?: TPlatformNamesKeys | 'all';
  accessType?: TAccessType;
  fromDate?: Date;
  toDate?: Date;
}

export interface ConnectionResultAgencyState {
  results: TConnectionResultResponse[];
  total: number;
  currentPage: number;
  pageSize: number;
  isLoading: boolean;
  error: string | null;
  filters: ConnectionResultFilters;
  agencyId: string | null;
}

const DEFAULT_STATE: ConnectionResultAgencyState = {
  results: [],
  total: 0,
  currentPage: 1,
  pageSize: 15,
  isLoading: false,
  error: null,
  filters: {
    platform: 'all',
    accessType: undefined,
    fromDate: undefined,
    toDate: undefined
  },
  agencyId: null
};

@Injectable({
  providedIn: 'root'
})
export class ConnectionResultAgencyStoreService {
  private connectionResultApiService = inject(ConnectionResultApiService);

  private state = signal<ConnectionResultAgencyState>({ ...DEFAULT_STATE });

  // Readonly signals for components
  readonly results = computed(() => this.state().results);
  readonly total = computed(() => this.state().total);
  readonly currentPage = computed(() => this.state().currentPage);
  readonly pageSize = computed(() => this.state().pageSize);
  readonly isLoading = computed(() => this.state().isLoading);
  readonly error = computed(() => this.state().error);
  readonly filters = computed(() => this.state().filters);

  // Computed values for UI
  readonly hasResults = computed(() => this.state().results.length > 0);
  readonly totalPages = computed(() =>
    Math.ceil(this.state().total / this.state().pageSize)
  );
  readonly isFirstPage = computed(() => this.state().currentPage === 1);
  readonly isLastPage = computed(() =>
    this.state().currentPage >= this.totalPages()
  );

  async loadConnectionResults(
    agencyId: string,
    filters?: Partial<ConnectionResultFilters>
  ): Promise<void> {
    this.setLoading(true);
    this.clearError();

    // Update state with agency ID
    this.state.update(state => ({
      ...state,
      agencyId,
      filters: {
        ...state.filters,
        ...filters
      }
    }));

    try {
      const currentState = this.state();
      const skip = (currentState.currentPage - 1) * currentState.pageSize;

      const filter: IConnectionResultFilterDto = {
        agencyId,
        skip: skip.toString(),
        limit: currentState.pageSize.toString(),
        sortBy: 'createdAt',
        sortOrder: 'desc',
        platform: currentState.filters.platform === 'all' ? undefined : currentState.filters.platform,
        accessType: currentState.filters.accessType,
        fromDate: currentState.filters.fromDate,
        toDate: currentState.filters.toDate
      };

      const response = await this.connectionResultApiService.findAll(filter);

      if (response.payload) {
        this.state.update(state => ({
          ...state,
          results: response.payload.data,
          total: response.payload.total,
          currentPage: response.payload.page,
          isLoading: false
        }));
      }
    } catch (error) {
      console.error('Error loading connection results:', error);
      this.setError('Failed to load connection results');
    } finally {
      this.setLoading(false);
    }
  }

  async changePage(page: number): Promise<void> {
    if (page < 1 || page > this.totalPages()) {
      return;
    }

    this.state.update(state => ({
      ...state,
      currentPage: page
    }));

    const agencyId = this.state().agencyId;
    if (agencyId) {
      await this.loadConnectionResults(agencyId);
    }
  }

  async nextPage(): Promise<void> {
    if (!this.isLastPage()) {
      await this.changePage(this.currentPage() + 1);
    }
  }

  async previousPage(): Promise<void> {
    if (!this.isFirstPage()) {
      await this.changePage(this.currentPage() - 1);
    }
  }

  async applyFilters(filters: Partial<ConnectionResultFilters>): Promise<void> {
    this.state.update(state => ({
      ...state,
      filters: {
        ...state.filters,
        ...filters
      },
      currentPage: 1 // Reset to first page when applying filters
    }));

    const agencyId = this.state().agencyId;
    if (agencyId) {
      await this.loadConnectionResults(agencyId);
    }
  }

  async clearFilters(): Promise<void> {
    await this.applyFilters({
      platform: 'all',
      accessType: undefined,
      fromDate: undefined,
      toDate: undefined
    });
  }

  async refresh(): Promise<void> {
    const agencyId = this.state().agencyId;
    if (agencyId) {
      await this.loadConnectionResults(agencyId);
    }
  }

  getResultById(id: string): TConnectionResultResponse | undefined {
    return this.state().results.find(result => result._id === id);
  }

  clearAll(): void {
    this.state.set({ ...DEFAULT_STATE });
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
      error,
      isLoading: false
    }));
  }

  private clearError(): void {
    this.setError(null);
  }
}