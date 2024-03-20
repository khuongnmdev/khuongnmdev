import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { canActiveDashboard } from '../core/guards/dashboard.guard';
import { LoginComponent } from '../auth/pages/login/login.component';
import { OverviewComponent } from './pages/overview/overview.component';

export const routes: Routes = [
  { path: '', component: OverviewComponent },
  // { path: 'overview', component: OverviewComponent, canActivate: [canActiveDashboard] },
  // { path: '**', redirectTo: '/login' }
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashboardRoutingModule { }
