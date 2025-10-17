import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RoutesService } from '../../services/routes.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  private readonly routesService = inject(RoutesService);

  readonly privacyPolicyRoute = this.routesService.privacyPolicy();
  readonly termsOfServiceRoute = this.routesService.termsOfService();
}
