import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { MenubarModule } from 'primeng/menubar';
import { Ripple } from "primeng/ripple";
import { DEFAULT_MENU_ITEMS } from "@constants/app-constants";

@Component({
  selector: 'k-header',
  standalone: true,
  imports: [
    CommonModule,
    MenubarModule,
    Ripple,
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent implements OnInit {
  protected readonly items: MenuItem[] = DEFAULT_MENU_ITEMS;

  constructor() {
  }

  ngOnInit() {

  }
}
