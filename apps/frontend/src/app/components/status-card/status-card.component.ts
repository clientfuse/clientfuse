import { Component, input, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { IslandComponent, IslandVariant, IslandDensity } from '../island/island.component';

@Component({
  selector: 'app-status-card',
  standalone: true,
  imports: [MatIconModule, IslandComponent],
  templateUrl: './status-card.component.html',
  styleUrl: './status-card.component.scss',
})
export class StatusCardComponent {
  readonly variant = input<IslandVariant>('neutral');
  readonly header = input.required<string>();
  readonly showIcon = input<boolean>(true);
  readonly density = input<IslandDensity>('compact');

  private readonly iconMap: Record<IslandVariant, string> = {
    success: 'check_circle',
    warning: 'warning',
    error: 'error',
    info: 'info',
    neutral: 'radio_button_unchecked'
  };

  readonly iconName = computed(() => this.iconMap[this.variant()]);
}