import { inject, Injectable } from '@angular/core';
import { Auth, authState, User, signInWithEmailAndPassword, signOut } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth = inject(Auth);
  public authState$ = authState(this.auth);
  constructor(
    private router: Router
  ) { }

  login(email: string, password: string) {
    signInWithEmailAndPassword(this.auth, email, password).then(() => {
      localStorage.setItem('token', 'true');
      this.router.navigate(['/dashboard']);
    }, err => {
      alert(err.message);
      this.router.navigate(['/login']);
    })
  }

  logout() {
    signOut(this.auth);
  }
}
