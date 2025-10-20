import { DOCUMENT, NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  Input,
  OnInit,
  signal,
} from '@angular/core';
import { MenuItem, DEFAULT_MENU } from '../../models/menu-item';
@Component({
  selector: 'app-nav-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.scss'],
  imports: [NgClass],
})
export class NavBarComponent implements OnInit {
  @Input() set activeSection(activeSection: MenuItem['id']) {
    this.activatedItem.set(activeSection);
  }

  protected menuList = signal<MenuItem[]>(DEFAULT_MENU);
  protected activatedItem = signal<MenuItem['id']>('');
  protected isShowMenu = signal<boolean>(false);

  constructor(
    @Inject(DOCUMENT) private document: Document) { }

  ngOnInit() { }

  protected toggleMenu() {
    this.isShowMenu.set(!this.isShowMenu());
  }

  protected navigateTo(item: MenuItem) {
    if (!item) return;
    this.activatedItem.set(item.id);
    this.scrollToElementId(item.id);
  }

  private scrollToElementId(id: string) {
    const element = document.querySelector(`#${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
