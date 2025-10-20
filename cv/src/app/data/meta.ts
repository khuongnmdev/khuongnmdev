import { MetaDefinition } from "@angular/platform-browser";

export const META_TAGS: MetaDefinition[] = [
  {
    name: 'description',
    content:
      'Resume of Khuong Nguyen, showcasing skills, experience, and achievements.',
  },
  { name: 'author', content: 'Khuong Nguyen' },
  {
    name: 'keywords',
    content:
      'Khuong Nguyen, resume, CV, software developer, web developer, Angular developer',
  },
  { name: 'robots', content: 'index, follow' },
  { property: 'og:title', content: `Khuong Nguyen's Resume` },
  {
    property: 'og:description',
    content: 'Explore the professional resume of Khuong Nguyen.',
  },
  { property: 'og:type', content: 'website' },
  {
    property: 'og:url',
    content: 'https://khuongnmdev.github.io/khuongnmdev/',
  },
  {
    property: 'og:image',
    content: 'https://khuongnmdev.github.io/khuongnmdev/preview.jpg',
  },
  { name: 'twitter:card', content: 'summary_large_image' },
  { name: 'twitter:title', content: `Khuong Nguyen's Resume` },
  {
    name: 'twitter:description',
    content: 'Discover Khuong Nguyen’s experience and skills.',
  },
  {
    name: 'twitter:image',
    content: 'https://khuongnmdev.github.io/khuongnmdev/preview.jpg',
  },
]
