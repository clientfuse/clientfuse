import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UIVariant, UIDensity } from '../../models/ui.model';

@Component({
  selector: 'app-island',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './island.component.html',
  styleUrl: './island.component.scss',
})
export class IslandComponent {
  readonly variant = input<UIVariant>('neutral');
  readonly borderAccent = input<boolean>(false);
  readonly density = input<UIDensity>('default');
}
