export interface MenuItem {
  name: string;
  id: string;
}

/**
 * Static placeholder menu; it will eventually be derived from the CV data's
 * `sections[]` so that menu contents and order are controlled by the data.
 */
export const DEFAULT_MENU: MenuItem[] = [
  {
    name: 'About',
    id: 'about',
  },
  {
    name: 'Experience',
    id: 'experience',
  },
  {
    name: 'Education',
    id: 'education',
  },
  {
    name: 'Skills',
    id: 'skills',
  },
  {
    name: 'Hobbies',
    id: 'hobbies',
  },
];
