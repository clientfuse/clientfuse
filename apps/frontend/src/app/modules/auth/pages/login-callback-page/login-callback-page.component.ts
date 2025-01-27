import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute } from '@angular/router';
import { AuthStoreService } from '../../../../services/auth/auth-store.service';

@Component({
  selector: 'app-login-callback-page',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './login-callback-page.component.html',
  styleUrl: './login-callback-page.component.scss'
})
export class LoginCallbackPageComponent implements OnInit {
  private authStoreService = inject(AuthStoreService);
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    const queryParams = this.route.snapshot.queryParams;
    const token: string | null = queryParams['token'];
    this.authStoreService.login(token as string).subscribe();
  }
}
