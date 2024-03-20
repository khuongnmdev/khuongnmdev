import { Routes } from '@angular/router';
import { LandingComponent } from './home/landing/landing.component';
import { LoginComponent } from './auth/pages/login/login.component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule) },
  // { path: '**', redirectTo: '/home' }
];
