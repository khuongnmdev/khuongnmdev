import { Injectable } from '@angular/core';
import { BehaviorSubject } from "rxjs";
import { Router } from "@angular/router";

@Injectable({
  providedIn: 'root'
})
export class FragmentService {
  private fragmentSubject = new BehaviorSubject<string | null>(null);
  public fragment$ = this.fragmentSubject.asObservable();

  constructor(
    private readonly router: Router
  ) {
  }

  setFragment(fragment: string | null) {
    console.log('setFragment: ', fragment);
    this.fragmentSubject.next(fragment);
    if (fragment) {
      this.updateUrlFragment(fragment);
    }
  }

  private updateUrlFragment(fragment: string): void {
    this.router.navigate([], {
      fragment: fragment,
      queryParamsHandling: 'preserve' // Preserve existing query params
    }).then();
  }

}
