import { Component } from '@angular/core';

@Component({
  selector: 'app-terms-of-service-page',
  standalone: true,
  imports: [],
  templateUrl: './terms-of-service-page.component.html',
  styleUrl: './terms-of-service-page.component.scss'
})
export class TermsOfServicePageComponent {
  readonly currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
