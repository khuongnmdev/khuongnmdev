import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { canActiveDashboard } from '../core/guards/dashboard.guard';
import { LoginPage } from '../home/pages/login/login.component';
import { OverviewComponent } from './pages/overview/overview.component';
import { NoPermissionComponent } from './pages/no-permission/no-permission.component';

export const routes: Routes = [
  { path: '', component: OverviewComponent, canActivate: [canActiveDashboard] },
  { path: 'no-permission', component: NoPermissionComponent },
  { path: '*', redirectTo: 'no-permission' }
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashboardRoutingModule { }
