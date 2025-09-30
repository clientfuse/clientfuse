import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { UIDensity, UIVariant } from '../../models/ui.model';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './badge.component.html',
  styleUrl: './badge.component.scss'
})
export class BadgeComponent {
  readonly variant = input<UIVariant>('neutral');
  readonly density = input<UIDensity>('default');
  readonly icon = input<string | undefined>(undefined);
  readonly text = input<string | undefined>(undefined);
}
