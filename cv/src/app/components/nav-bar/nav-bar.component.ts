import { DOCUMENT, NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Inject,
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
  protected menuList$$ = signal<MenuItem[]>(DEFAULT_MENU);
  protected activatedItem$$ = signal<MenuItem['id']>('');
  constructor(@Inject(DOCUMENT) private document: Document) {}

  public ngOnInit() {}

  protected navigateTo(item: MenuItem) {
    if (!item) return;
    this.activatedItem$$.set(item.id);
    this.scrollToElementId(item.id);
  }

  private scrollToElementId(id: string) {
    const element = document.querySelector(`#${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
