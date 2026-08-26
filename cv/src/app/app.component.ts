import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { NavBarComponent } from './components/nav-bar/nav-bar.component';
import { AboutComponent } from './components/about/about.component';
import { ExperienceComponent } from './components/experience/experience.component';
import { EducationComponent } from './components/education/education.component';
import { SkillsComponent } from './components/skills/skills.component';
import { HobbiesComponent } from './components/hobbies/hobbies.component';
import { ActiveSectionDirective } from './directives/active-section.directive';
import { META_TAGS } from './data/meta';

@Component({
  selector: 'app-root',
  imports: [
    NavBarComponent,
    AboutComponent,
    ExperienceComponent,
    EducationComponent,
    SkillsComponent,
    HobbiesComponent,
    ActiveSectionDirective,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  protected readonly appTitle = `Khuong Nguyen's Resume`;

  /**
   * Section currently in view. Must be a signal, not a plain field: the value
   * arrives from an IntersectionObserver callback, which fires outside
   * Angular — under zoneless change detection only a signal write schedules a
   * render.
   */
  protected readonly currentActiveSection = signal('');

  constructor() {
    this.title.setTitle(this.appTitle);
    this.meta.addTags(META_TAGS);
  }

  protected onSectionActive(sectionId: string, isIntersecting: boolean): void {
    if (isIntersecting) {
      // Set the active section when its directive tells us it is in view.
      this.currentActiveSection.set(sectionId);
    }
  }
}
