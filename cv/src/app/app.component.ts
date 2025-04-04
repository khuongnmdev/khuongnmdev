import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SideBarComponent } from "./components/side-bar/side-bar.component";
import { HeaderComponent } from "./components/header/header.component";
import { Meta, Title } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SideBarComponent, HeaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  constructor(
    private readonly title: Title,
    private readonly meta: Meta
  ) {
    this.title.setTitle('Khuong Nguyen Resume');
    this.meta.addTag({ name: 'description', content: 'Resume of Khuong Nguyen' });
  }
}

