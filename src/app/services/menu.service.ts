import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private readonly _leftMenuInvisible = new BehaviorSubject<boolean>(true);

  constructor() {
  }

  get leftMenuInvisible(): Observable<boolean> {
    return this._leftMenuInvisible.asObservable();
  }

  public setLeftMenu(input: boolean): void {
    this._leftMenuInvisible.next(input);
  }

  public toggleLeftMenu(): void {
    this._leftMenuInvisible.next(!this._leftMenuInvisible.value);
  }
}
