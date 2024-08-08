import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { MenubarModule } from 'primeng/menubar';

@Component({
  selector: 'k-header',
  standalone: true,
  imports: [
    CommonModule,
    MenubarModule,
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent implements OnInit {
  items: MenuItem[] | undefined;

  constructor() { }

  ngOnInit() {
    this.items = [
      {
        label: 'Home',
        icon: 'pi pi-home',
        url: '/'
      },
      {
        label: 'About',
        icon: 'pi pi-user',
        url: '#about'
      },
      {
        label: 'Skills',
        icon: 'pi pi-list',
        url: '#skill'
      },
      {
        label: 'Experience',
        icon: 'pi pi-calendar',
        url: '#skill'
      },
      {
        label: 'Contact',
        icon: 'pi pi-envelope',
        url: '#contact'
      }
    ]
  }
}
