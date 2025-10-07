import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { VALIDATORS } from '@clientfuse/models';
import { AgencyStoreService } from '../../../../services/agency/agency-store.service';
import { SnackbarService } from '../../../../services/snackbar.service';

@Component({
  selector: 'app-settings-white-labeling-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './settings-white-labeling-page.component.html',
  styleUrl: './settings-white-labeling-page.component.scss'
})
export class SettingsWhiteLabelingPageComponent {
  private fb = inject(FormBuilder);
  private agencyStoreService = inject(AgencyStoreService);
  private snackbarService = inject(SnackbarService);

  whiteLabelingForm: FormGroup = this.fb.group({
    agencyName: [
      '',
      [
        Validators.minLength(VALIDATORS.AGENCY.WHITE_LABELING.AGENCY_NAME.MIN_LENGTH),
        Validators.maxLength(VALIDATORS.AGENCY.WHITE_LABELING.AGENCY_NAME.MAX_LENGTH)
      ]
    ]
  });
  isLoading = signal(false);
  isUploadingLogo = signal(false);
  isDeletingLogo = signal(false);
  isProcessingLogo = computed(() => this.isUploadingLogo() || this.isDeletingLogo());

  agency = computed(() => this.agencyStoreService.agency());
  currentLogoUrl = computed(() => this.agency()?.whiteLabeling?.agencyLogo || null);
  currentAgencyName = computed(() => this.agency()?.whiteLabeling?.agencyName || null);
  previewUrl = signal<string | null>(null);
  formInitEffect = effect(() => {
    if (this.currentAgencyName()) {
      this.whiteLabelingForm.patchValue({
        agencyName: this.currentAgencyName()
      });
    }

    if (this.currentLogoUrl()) {
      console.log('Setting previewUrl to currentLogoUrl:', this.currentLogoUrl());
      this.previewUrl.set(this.currentLogoUrl());
    }
  }, { allowSignalWrites: true });

  readonly VALIDATORS = VALIDATORS;
  readonly maxNameLength =
    VALIDATORS.AGENCY.WHITE_LABELING.AGENCY_NAME.MAX_LENGTH;
  readonly allowedFormats =
    VALIDATORS.AGENCY.WHITE_LABELING.LOGO.ALLOWED_EXTENSIONS.join(', ');

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      const allowedTypes =
        VALIDATORS.AGENCY.WHITE_LABELING.LOGO.ALLOWED_FORMATS;
      if (!allowedTypes.includes(file.type as any)) {
        this.snackbarService.error(
          `Only ${this.allowedFormats} files are allowed`
        );
        input.value = '';
        return;
      }

      if (file.size > VALIDATORS.AGENCY.WHITE_LABELING.LOGO.MAX_SIZE_BYTES) {
        this.snackbarService.error(
          `File size must be less than ${VALIDATORS.AGENCY.WHITE_LABELING.LOGO.MAX_SIZE_MB}MB`
        );
        input.value = '';
        return;
      }

      const agencyId = this.agency()?._id;
      if (!agencyId) return;

      this.isUploadingLogo.set(true);

      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.previewUrl.set(e.target?.result as string);
        };
        reader.readAsDataURL(file);

        const formData = new FormData();
        formData.append('logo', file);
        await this.agencyStoreService.uploadLogo(agencyId, formData);
        this.snackbarService.success('Logo uploaded successfully');
      } catch (error) {
        console.error('Error uploading logo:', error);
        this.snackbarService.error('Failed to upload logo');
        this.previewUrl.set(this.currentLogoUrl());
      } finally {
        this.isUploadingLogo.set(false);
        input.value = '';
      }
    }
  }

  async deleteLogo(): Promise<void> {
    const agencyId = this.agency()?._id;
    if (!agencyId) return;

    this.isDeletingLogo.set(true);

    try {
      await this.agencyStoreService.deleteLogo(agencyId);
      this.previewUrl.set(null);
      this.snackbarService.success('Logo deleted successfully');
    } catch (error) {
      console.error('Error deleting logo:', error);
      this.snackbarService.error('Failed to delete logo');
    } finally {
      this.isDeletingLogo.set(false);
    }
  }

  async saveSettings(): Promise<void> {
    if (this.whiteLabelingForm.invalid) return;

    const agencyId = this.agency()?._id;
    if (!agencyId) return;

    this.isLoading.set(true);

    try {
      const agencyName = this.whiteLabelingForm.value.agencyName;
      await this.agencyStoreService.updateAgency(agencyId, {
        whiteLabeling: {
          agencyLogo: this.agency()?.whiteLabeling?.agencyLogo ?? null,
          agencyName: agencyName || null
        }
      });
      this.snackbarService.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      this.snackbarService.error('Failed to save settings');
    } finally {
      this.isLoading.set(false);
    }
  }

  clearAgencyName(): void {
    this.whiteLabelingForm.patchValue({ agencyName: '' });
  }
}
