import { inject, Injectable, signal } from '@angular/core';
import { IUserResponse } from '@connectly/models';
import { tap } from 'rxjs';
import { ProfileApiService } from './profile-api.service';

@Injectable({
  providedIn: 'root'
})
export class ProfileStoreService {
  private profileApiService = inject(ProfileApiService);
  private _profile = signal<IUserResponse | null>(null);
  profile = this._profile.asReadonly();

  getProfile$() {
    return this.profileApiService.getProfile$()
      .pipe(tap((data) => this.setProfile(data.payload)));
  }

  setProfile(profile: IUserResponse) {
    this._profile.set(profile);
  }

  updateProfile(partial: Partial<IUserResponse>) {
    const updatedProfile = { ...this.profile(), ...partial } as IUserResponse;
    // TODO : Call API to update profile
    this._profile.set(updatedProfile);
  }

  clearProfile() {
    this._profile.set(null);
  }
}
