import {Routes} from '@angular/router';
import {LandingComponent} from './modules/landing/landing.component';
import {LoginPageComponent} from './modules/login/login.component';
import {NoPermissionComponent} from "./modules/dashboard/pages/no-permission/no-permission.component";
import {OverviewComponent} from "./modules/dashboard/pages/overview/overview.component";
import {canActiveDashboard} from "@core/guards/dashboard.guard";

export const routes: Routes = [
  {path: '', component: LandingComponent},
  {path: 'login', component: LoginPageComponent},
  {
    path: 'dashboard', loadComponent: () => import('./modules/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [canActiveDashboard],
    children: [
      {path: '', component: OverviewComponent},
      {path: 'no-permission', component: NoPermissionComponent},
    ]
  },
  {path: 'no-permission', component: NoPermissionComponent},
  {path: '**', redirectTo: ''}
];
