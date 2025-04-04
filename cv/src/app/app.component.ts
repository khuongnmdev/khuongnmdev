import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavBarComponent } from "./components/nav-bar/nav-bar.component";
import { Meta, Title } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavBarComponent,],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  public appTitle = 'Khuong Nguyen Resume';
  constructor(
    private readonly title: Title,
    private readonly meta: Meta
  ) {
    this.title.setTitle(this.appTitle);
    this.meta.addTag({ name: 'description', content: 'Resume of Khuong Nguyen' });
  }
}

