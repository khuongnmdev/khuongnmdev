import { Routes } from '@angular/router';
import { MainComponent } from '@app/pages/main/main.component';
import { languageResolver } from '@core/i18n/language.resolver';
import { LOCALE_PATH_PREFIX } from '@core/i18n/localized-url';

/** The pages every language serves; the language comes from the parent route. */
function localizedPages(): Routes {
  return [
    { path: '', component: MainComponent },
    {
      path: 'print',
      // Lazy on purpose: the print theme should not weigh down the initial
      // bundle of the page most visitors never print from.
      loadComponent: () =>
        import('@app/themes/print/print-page.component').then(
          (module) => module.PrintPageComponent,
        ),
    },
  ];
}

export const routes: Routes = [
  {
    path: LOCALE_PATH_PREFIX.vi,
    resolve: { language: languageResolver('vi') },
    children: [
      ...localizedPages(),
      // A mistyped path under the Vietnamese prefix stays in Vietnamese.
      { path: '**', redirectTo: '' },
    ],
  },
  {
    // English, the default language, owns the unprefixed paths.
    path: LOCALE_PATH_PREFIX.en,
    resolve: { language: languageResolver('en') },
    children: localizedPages(),
  },
  // Last on purpose: the static host serves the app shell for any unknown
  // path, so a mistyped or stale link must land on the CV rather than on an
  // empty outlet with a router error in the console.
  { path: '**', redirectTo: '' },
];
