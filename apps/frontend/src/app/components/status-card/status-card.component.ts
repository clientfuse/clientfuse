import { Component, input, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { IslandComponent } from '../island/island.component';
import { UIVariant, UIDensity } from '../../models/ui.model';

@Component({
  selector: 'app-status-card',
  standalone: true,
  imports: [MatIconModule, IslandComponent],
  templateUrl: './status-card.component.html',
  styleUrl: './status-card.component.scss',
})
export class StatusCardComponent {
  readonly variant = input<UIVariant>('neutral');
  readonly header = input.required<string>();
  readonly showIcon = input<boolean>(true);
  readonly density = input<UIDensity>('compact');

  private readonly iconMap: Record<UIVariant, string> = {
    success: 'check_circle',
    warning: 'warning',
    error: 'error',
    info: 'info',
    neutral: 'radio_button_unchecked'
  };

  readonly iconName = computed(() => this.iconMap[this.variant()]);
}