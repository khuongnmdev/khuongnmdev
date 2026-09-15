import { NgComponentOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, Type } from '@angular/core';
import type { SectionId } from '@core/models/cv-data.model';
import { CvDataService } from '@core/services/cv-data.service';
import { SidebarService } from '@core/services/sidebar.service';
import { NavBarComponent } from '@app/components/nav-bar/nav-bar.component';
import { AboutComponent } from '@app/components/about/about.component';
import { ExperienceComponent } from '@app/components/experience/experience.component';
import { EducationComponent } from '@app/components/education/education.component';
import { SkillsComponent } from '@app/components/skills/skills.component';
import { HobbiesComponent } from '@app/components/hobbies/hobbies.component';
import { ActiveSectionDirective } from '@app/directives/active-section.directive';

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

/**
 * The web theme's page: navigation shell plus the data-driven section list.
 * Lives behind the default route so other routes (the print preview) can
 * render without the shell.
 */
@Component({
  selector: 'app-home',
  imports: [NavBarComponent, ActiveSectionDirective, NgComponentOutlet],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private readonly cvData = inject(CvDataService);
  private readonly sidebar = inject(SidebarService);

  /** Enabled sections in data order — the single source of the page layout. */
  protected readonly sections = this.cvData.sections;

  /**
   * Collapsed state of the desktop sidebar. The nav bar owns the toggle; the
   * page only follows so the content margin matches the panel width.
   */
  protected readonly sidebarCollapsed = this.sidebar.collapsed;

  /**
   * Section currently in view. Must be a signal, not a plain field: the value
   * arrives from an IntersectionObserver callback, which fires outside
   * Angular — under zoneless change detection only a signal write schedules a
   * render.
   */
  protected readonly currentActiveSection = signal('');

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
