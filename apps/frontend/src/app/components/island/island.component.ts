import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type IslandVariant = 'neutral' | 'success' | 'error' | 'warning' | 'info';
export type IslandDensity = 'compact' | 'default' | 'comfortable';

@Component({
  selector: 'app-island',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './island.component.html',
  styleUrl: './island.component.scss',
})
export class IslandComponent {
  readonly variant = input<IslandVariant>('neutral');
  readonly borderAccent = input<boolean>(false);
  readonly density = input<IslandDensity>('default');
}
