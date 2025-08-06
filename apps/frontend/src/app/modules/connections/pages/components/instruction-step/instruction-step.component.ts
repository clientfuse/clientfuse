import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-instruction-step',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './instruction-step.component.html',
  styleUrl: './instruction-step.component.scss'
})
export class InstructionStepComponent {
  readonly stepNumber = input<number | null | undefined>(null);
}
