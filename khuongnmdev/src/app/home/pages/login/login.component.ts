import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormLoginComponent } from '../../components/form-login/form-login.component';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'k-login',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    FormLoginComponent
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage { }
