import { Routes } from '@angular/router';
import { HomeComponent } from '@app/pages/home/home.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  {
    path: 'print',
    // Lazy on purpose: the print theme should not weigh down the initial
    // bundle of the page most visitors never print from.
    loadComponent: () =>
      import('@app/themes/print/print-page.component').then((module) => module.PrintPageComponent),
  },
];
