import { Routes } from '@angular/router';
import { LandingComponent } from './home/pages/landing/landing.component';
import { LoginPage } from './home/pages/login/login.component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login', component: LoginPage },
  { path: 'dashboard', loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule) },
  // { path: '**', redirectTo: '/home' }
];
