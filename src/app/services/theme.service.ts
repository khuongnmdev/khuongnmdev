import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private _isDarkMode = new BehaviorSubject<boolean>(true);

  constructor(@Inject(DOCUMENT) private document: Document) {
  }

  public isDarkMode() {
    return this._isDarkMode.asObservable();
  }

  public switchTheme() {
    const themeLink = this.document.getElementById('k-theme') as HTMLLinkElement;

    this._isDarkMode.next(!this._isDarkMode.value);
    const hrefLink = `${this._isDarkMode.value ? 'md-dark' : 'md-light'}.css`;
    if (themeLink) {
      themeLink.href = hrefLink;
    }
  }
}
