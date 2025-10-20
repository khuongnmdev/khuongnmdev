import { Component } from '@angular/core';
import { NavBarComponent } from './components/nav-bar/nav-bar.component';
import { Meta, Title } from '@angular/platform-browser';
import { AboutComponent } from './components/about/about.component';
import { EducationComponent } from './components/education/education.component';
import { ExperienceComponent } from './components/experience/experience.component';
import { SkillsComponent } from "./components/skills/skills.component";
import { HobbiesComponent } from "./components/hobbies/hobbies.component";
import { ActiveSectionDirective } from './directives/active-section.directive';
import { META_TAGS } from './data/meta';

@Component({
  selector: 'app-root',
  imports: [
    NavBarComponent,
    AboutComponent,
    EducationComponent,
    ExperienceComponent,
    SkillsComponent,
    HobbiesComponent,
    ActiveSectionDirective
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  appTitle = `Khuong Nguyen's Resume`;
  currentActiveSection = '';
  constructor(
    private readonly title: Title,
    private readonly meta: Meta) {
    this.title.setTitle(this.appTitle);
    this.meta.addTags(META_TAGS);
  }

  onSectionActive(sectionId: string, isIntersecting: boolean): void {
    if (isIntersecting) {
      // Set the active section when its directive tells us it's in view
      this.currentActiveSection = sectionId;
    }
  }
}
