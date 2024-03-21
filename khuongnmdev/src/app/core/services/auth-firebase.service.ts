import { inject, Injectable } from '@angular/core';
import { Auth, authState, GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup, signOut } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { catchError, from, switchMap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthFireBaseService {
  private auth: Auth = inject(Auth);
  private googleAuthProvider: GoogleAuthProvider = new GoogleAuthProvider();
  public authState$ = authState(this.auth);
  constructor(
    private router: Router
  ) { }

  public login(email: string, password: string) {
    from(signInWithEmailAndPassword(this.auth, email, password))
      .pipe(
        switchMap((result) => {
          console.log('signInWithEmailAndPassword: ', result);
          localStorage.setItem('user', JSON.stringify(result.user));
          return this.router.navigate(['dashboard']);
        }),
        catchError(error => {
          alert(error.message);
          return throwError(() => error);
        })
      ).subscribe();
  }

  public loginGoogle() {
    from(signInWithPopup(this.auth, this.googleAuthProvider))
      .pipe(
        switchMap((result) => {
          console.log('signInWithPopup: ', result);
          localStorage.setItem('user', JSON.stringify(result.user));
          return this.router.navigate(['dashboard']);
        }),
        catchError(error => {
          console.error('[error] signInWithPopup: ', error.message);
          return throwError(() => error);
        })
      ).subscribe();
  }

  public logout() {
    signOut(this.auth);
  }
}
