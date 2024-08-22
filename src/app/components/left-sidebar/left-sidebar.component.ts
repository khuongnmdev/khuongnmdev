import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SidebarModule } from "primeng/sidebar";
import { Ripple } from "primeng/ripple";

@Component({
  selector: 'k-left-sidebar',
  standalone: true,
  imports: [
    SidebarModule,
    Ripple
  ],
  templateUrl: './left-sidebar.component.html',
  styleUrl: './left-sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LeftSidebarComponent {

}
