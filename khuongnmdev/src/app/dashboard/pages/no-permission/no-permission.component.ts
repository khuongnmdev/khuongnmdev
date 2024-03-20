import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-no-permission',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './no-permission.component.html',
  styleUrl: './no-permission.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoPermissionComponent { }
