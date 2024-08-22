import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AuthFireBaseService } from '../../../../services/auth-firebase.service';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';

@Component({
  selector: 'k-overview',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
  ],
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverviewComponent {

  constructor(private authFireBaseService: AuthFireBaseService,
    private router: Router
  ) {

  }
  protected logout(): void {
    this.authFireBaseService.logout();
    this.router.navigate(['/login']);
  }
}
