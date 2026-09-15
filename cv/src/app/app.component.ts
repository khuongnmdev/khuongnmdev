import { NgComponentOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, Type } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import type { SectionId } from '@core/models/cv-data.model';
import { CvDataService } from '@core/services/cv-data.service';
import { META_TAGS } from '@data/meta';
import { NavBarComponent } from './components/nav-bar/nav-bar.component';
import { AboutComponent } from './components/about/about.component';
import { ExperienceComponent } from './components/experience/experience.component';
import { EducationComponent } from './components/education/education.component';
import { SkillsComponent } from './components/skills/skills.component';
import { HobbiesComponent } from './components/hobbies/hobbies.component';
import { ActiveSectionDirective } from './directives/active-section.directive';

/**
 * Maps a section id to the component rendering it. Section ids present in the
 * data but absent here (for example `projects`, which has no component yet)
 * are skipped silently, so enabling such a section in the JSON is harmless
 * until its component exists and is registered.
 */
const SECTION_COMPONENTS: Partial<Record<SectionId, Type<unknown>>> = {
  about: AboutComponent,
  experience: ExperienceComponent,
  education: EducationComponent,
  skills: SkillsComponent,
  hobbies: HobbiesComponent,
};

@Component({
  selector: 'app-root',
  imports: [NavBarComponent, ActiveSectionDirective, NgComponentOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly cvData = inject(CvDataService);

  protected readonly appTitle = `Khuong Nguyen's Resume`;

  /** Enabled sections in data order — the single source of the page layout. */
  protected readonly sections = this.cvData.sections;

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

  protected componentFor(id: SectionId): Type<unknown> | undefined {
    return SECTION_COMPONENTS[id];
  }

  protected onSectionActive(sectionId: string, isIntersecting: boolean): void {
    if (isIntersecting) {
      // Set the active section when its directive tells us it is in view.
      this.currentActiveSection.set(sectionId);
    }
  }
}
