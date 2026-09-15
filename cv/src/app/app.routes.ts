import { Routes } from '@angular/router';
import { MainComponent } from '@app/pages/main/main.component';

export const routes: Routes = [
  { path: '', component: MainComponent },
  {
    path: 'print',
    // Lazy on purpose: the print theme should not weigh down the initial
    // bundle of the page most visitors never print from.
    loadComponent: () =>
      import('@app/themes/print/print-page.component').then((module) => module.PrintPageComponent),
  },
  // Last on purpose: the static host serves the app shell for any unknown
  // path, so a mistyped or stale link must land on the CV rather than on an
  // empty outlet with a router error in the console.
  { path: '**', redirectTo: '' },
];
