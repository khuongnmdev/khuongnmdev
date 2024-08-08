import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { AuthFireBaseService } from '../../core/services/auth-firebase.service';

@Component({
  selector: 'k-form-login',
  templateUrl: './form-login.component.html',
  styleUrls: ['./form-login.component.scss'],
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    FloatLabelModule,
    ButtonModule,
    CardModule,
    DividerModule
  ],
  standalone: true
})
export class FormLoginComponent implements OnInit {
  protected loginForm!: FormGroup;
  private destroyRef = inject(DestroyRef);
  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthFireBaseService) { }


  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  login(): void {
    this.loginForm.markAllAsTouched();
    if (this.loginForm.invalid) {
      return;
    }
    this.authService.login(this.loginForm.value.username, this.loginForm.value.password)
      .subscribe(
        {
          next: rs => {
            if (rs.user) {
              this.router.navigate(['dashboard']);
            }
            console.log('login rs: ', rs);
          },
          error: error => {
            console.error('login error: ', error);
          }
        }
      );
  }


  loginWithGoogle() {
    this.authService.loginGoogle();
  }
}
