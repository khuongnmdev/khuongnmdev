import {MenuItem} from "primeng/api/menuitem";

export const DEFAULT_MENU_ITEMS: MenuItem[] = [
  {
    label: 'Home',
    icon: 'pi pi-home',
    routerLink: ['/'],
    fragment: 'home',
  },
  {
    label: 'About',
    icon: 'pi pi-user',
    routerLink: ['/'],

    fragment: 'about'
  },
  {
    label: 'Skills',
    icon: 'pi pi-list',
    routerLink: ['/'],
    fragment: 'skill'
  },
  {
    label: 'Experience',
    icon: 'pi pi-calendar',
    routerLink: ['/'],
    fragment: 'experience'
  },
  {
    label: 'Contact',
    icon: 'pi pi-envelope',
    routerLink: ['/'],
    fragment: 'contact'
  }
]
