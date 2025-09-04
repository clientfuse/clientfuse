import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export type BadgeVariant = 'neutral' | 'success' | 'error' | 'warning' | 'info';
export type BadgeDensity = 'compact' | 'default' | 'comfortable';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './badge.component.html',
  styleUrl: './badge.component.scss',
})
export class BadgeComponent {
  readonly variant = input<BadgeVariant>('neutral');
  readonly density = input<BadgeDensity>('default');
  readonly icon = input<string | undefined>(undefined);
  readonly text = input<string | undefined>(undefined);
}