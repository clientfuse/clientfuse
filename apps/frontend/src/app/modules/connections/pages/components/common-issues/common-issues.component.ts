import { CommonModule } from '@angular/common';
import { Component, input, signal } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';

@Component({
  selector: 'app-common-issues',
  standalone: true,
  imports: [
    CommonModule,
    MatExpansionModule
  ],
  templateUrl: './common-issues.component.html',
  styleUrl: './common-issues.component.scss'
})
export class CommonIssuesComponent {
  readonly businessPortfolioId = input.required<string>();
  readonly showVerifyAccountSection = signal<boolean>(false);

  toggleVerifyAccountSection(): void {
    this.showVerifyAccountSection.update(value => !value);
  }
}