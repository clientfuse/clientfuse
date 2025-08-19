import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatAccordion, MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle } from '@angular/material/expansion';
import { ConnectionStoreService } from '../../../../../services/connect/connection-store.service';

@Component({
  selector: 'app-confirm-access',
  standalone: true,
  imports: [
    CommonModule,
    MatAccordion,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle
  ],
  templateUrl: './confirm-access.component.html',
  styleUrl: './confirm-access.component.scss'
})
export class ConfirmAccessComponent {
  protected connectionStoreService = inject(ConnectionStoreService);
}
