import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-access-outcome',
  standalone: true,
  imports: [CommonModule, MatButton, MatIcon],
  templateUrl: './access-outcome.component.html',
  styleUrl: './access-outcome.component.scss',
})
export class AccessOutcomeComponent {}
