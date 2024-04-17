import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeServiceService {

  constructor(@Inject(DOCUMENT) private document: Document) { }

  public switchTheme(theme: string) {
    let themeLink = this.document.getElementById('k-theme') as HTMLLinkElement;

    if (themeLink) {
      themeLink.href = theme + '.css';
    }
  }
}
