import { Component } from '@angular/core';
import { NavBarComponent } from './components/nav-bar/nav-bar.component';
import { Meta, Title } from '@angular/platform-browser';
import { AboutComponent } from './components/about/about.component';
import { EducationComponent } from './components/education/education.component';
import { ExperienceComponent } from './components/experience/experience.component';

@Component({
  selector: 'app-root',
  imports: [
    NavBarComponent,
    AboutComponent,
    EducationComponent,
    ExperienceComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  public appTitle = `Khuong Nguyen's Resume`;
  constructor(private readonly title: Title, private readonly meta: Meta) {
    this.title.setTitle(this.appTitle);
    this.meta.addTag({
      name: 'description',
      content: 'Resume of Khuong Nguyen',
    });
  }
}
