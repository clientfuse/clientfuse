import { Component, effect, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { checkIfNoUserEmail } from '@clientfuse/utils';
import { firstValueFrom } from 'rxjs';
import { FooterComponent } from './components/footer/footer.component';
import { HeaderComponent } from './components/header/header.component';
import { UpdateEmailModalComponent } from './components/modals/update-email-modal/update-email-modal.component';
import { AuthStoreService } from './services/auth/auth-store.service';
import { DialogService } from './services/dialog.service';
import { ProfileStoreService } from './services/profile/profile-store.service';

@Component({
  standalone: true,
  imports: [RouterModule, HeaderComponent, FooterComponent],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private readonly dialogService = inject(DialogService);
  private readonly profileStoreService = inject(ProfileStoreService);
  private readonly authStoreService = inject(AuthStoreService);

  checkEmailEffect = effect(async () => {
    const email = this.profileStoreService.profile()?.email;
    const isLoggedIn = this.authStoreService.isLoggedIn();
    if (isLoggedIn && checkIfNoUserEmail(email)) {
      const result: string = await firstValueFrom(this.dialogService.open(UpdateEmailModalComponent).afterClosed());
      await this.authStoreService.updateEmail(result);
    }
  });
}
