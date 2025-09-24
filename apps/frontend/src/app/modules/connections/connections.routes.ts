import { Routes } from '@angular/router';
import { RoutesService } from '../../services/routes.service';
import { ConnectionsPageComponent } from './pages/connections-page/connections-page.component';

export const CONNECTIONS_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: RoutesService.routes.connections.connection,
        component: ConnectionsPageComponent
      }
    ]
  }
];
