import { Routes } from '@angular/router';
import { ConnectionsPageComponent } from './pages/connections-page/connections-page.component';

export const CONNECTIONS_ROUTES: Routes = [
  {
    path: '',
    component: ConnectionsPageComponent,
    children: []
  }
];
