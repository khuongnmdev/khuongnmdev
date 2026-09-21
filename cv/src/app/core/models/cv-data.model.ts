/**
 * CV data model — the single source of truth shared by every theme.
 *
 * Principles:
 * - Data carries content only: no colors, CSS classes, or styling.
 * - Dates are `YYYY-MM` strings rather than `Date`, to stay timezone-independent.
 * - The `showInWeb` / `showInPrint` flags let one dataset render differently on
 *   the web (full detail) and in the A4 export (trimmed to fit).
 */

/** `YYYY-MM`, for example `"2021-04"`. */
export type YearMonth = string;

/** `YYYY-MM-DD`, for example `"2026-08-10"`. */
export type IsoDate = string;

/*
 * Each literal union below is declared once as an `as const` array, and the
 * type derives from it. The runtime validator iterates the same arrays, so the
 * compile-time unions and the runtime checks can never drift apart.
 */

/** Allowed skill levels: 1 = beginner, 5 = expert. */
export const SKILL_LEVELS = [1, 2, 3, 4, 5] as const;
export type SkillLevel = (typeof SKILL_LEVELS)[number];

export const EMPLOYMENT_TYPES = [
  'full-time',
  'part-time',
  'freelance',
  'contract',
  'internship',
] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const CONTACT_TYPES = [
  'email',
  'phone',
  'linkedin',
  'github',
  'website',
  'address',
  'birthday',
  'other',
] as const;
export type ContactType = (typeof CONTACT_TYPES)[number];

export const SECTION_IDS = [
  'about',
  'experience',
  'education',
  'skills',
  'projects',
  'certifications',
  'languages',
  'hobbies',
] as const;
export type SectionId = (typeof SECTION_IDS)[number];

/**
 * Languages the site ships a dataset for. The first entry is the default: it
 * is bundled eagerly and served from the unprefixed URLs.
 */
export const SUPPORTED_LOCALES = ['en', 'vi'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = SUPPORTED_LOCALES[0];

export function isLocale(value: unknown): value is Locale {
  return (SUPPORTED_LOCALES as readonly unknown[]).includes(value);
}

/** Shared visibility flags. An omitted flag is treated as `true`. */
export interface Visibility {
  showInWeb?: boolean;
  showInPrint?: boolean;
}

export interface CvMeta {
  /** Schema version, used to validate user-uploaded data files. */
  version: string;
  /** Content language, for example `"en"` or `"vi"`. */
  locale: string;
  updatedAt: IsoDate;
}

export interface Profile {
  fullName: string;
  /** Shorter name for tight layouts. */
  displayName?: string;
  headline: string;
  avatar: string;
  /** One bullet point per entry. */
  summary: string[];
  /** Coarse location, safe to publish. The full address lives in `contacts`. */
  location?: string;
  /**
   * Career start. Themes derive years of experience from this instead of
   * hardcoding a number, so the CV does not go stale on its own.
   */
  careerStartDate: YearMonth;
}

export interface ContactItem extends Visibility {
  type: ContactType;
  label: string;
  value: string;
  /** Full link, for example `"mailto:..."`. Omit when not clickable. */
  href?: string;
  /** Icon class, for example `"fa-solid fa-envelope"`. Themes may ignore it. */
  icon?: string;
}

/** A project delivered during one period of employment. */
export interface WorkProject extends Visibility {
  name: string;
  description: string;
  role: string;
  teamSize?: number;
  techStack: string[];
  highlights?: string[];
}

export interface ExperienceItem extends Visibility {
  company: string;
  companyUrl?: string;
  role: string;
  employmentType?: EmploymentType;
  location?: string;
  startDate: YearMonth;
  /** `null` while still employed. */
  endDate: YearMonth | null;
  current: boolean;
  summary?: string;
  highlights?: string[];
  techStack?: string[];
  projects?: WorkProject[];
}

export interface EducationItem extends Visibility {
  school: string;
  degree: string;
  field?: string;
  startDate: YearMonth;
  endDate: YearMonth | null;
  gpa?: string;
  highlights?: string[];
}

export interface SkillItem {
  name: string;
  level?: SkillLevel;
  /** Years of hands-on use. */
  years?: number;
  icon?: string;
}

export interface SkillGroup extends Visibility {
  category: string;
  items: SkillItem[];
}

export interface ProjectLink {
  label: string;
  href: string;
  icon?: string;
}

/** A personal project, kept separate from `ExperienceItem.projects`. */
export interface PersonalProject extends Visibility {
  name: string;
  description: string;
  role?: string;
  startDate?: YearMonth;
  endDate?: YearMonth | null;
  techStack: string[];
  links?: ProjectLink[];
  highlights?: string[];
}

export interface Certification extends Visibility {
  name: string;
  issuer: string;
  issueDate: YearMonth;
  expiryDate?: YearMonth | null;
  credentialId?: string;
  credentialUrl?: string;
}

export interface LanguageItem extends Visibility {
  name: string;
  /** Free text, for example `"Native"` or `"Professional working"`. */
  level: string;
  note?: string;
}

export interface HobbyItem extends Visibility {
  name: string;
  icon?: string;
  description?: string;
}

/**
 * Section configuration — the single source of truth for the navigation menu
 * and render order. Adding, removing, or reordering a section is a JSON edit.
 */
export interface SectionConfig {
  id: SectionId;
  title: string;
  order: number;
  enabled: boolean;
  showInPrint: boolean;
  /** Menu icon class, for example `"fa-solid fa-user"`. Themes may ignore it. */
  icon?: string;
}

/**
 * Every flat interface string a theme renders — labels, accessible names,
 * tooltips, and sentence templates. Declared once: `UiStrings` derives from
 * this list and the runtime validator iterates it.
 */
export const UI_STRING_KEYS = [
  'present',
  'yearsOfExperience',
  'printLead',
  'teamSize',
  'gpa',
  'technologies',
  'techStack',
  'skillLevel',
  'expandMenu',
  'collapseMenu',
  'openMenu',
  'closeMenu',
  'sectionNavigation',
  'sectionMenu',
  'switchLight',
  'switchDark',
  'exportPdf',
  'language',
  'printBack',
  'printTemplate',
  'printTemplateClassic',
  'printTemplateCompact',
  'printExport',
  'printPreviewNote',
  'pageTitle',
  'metaDescription',
  'metaDescriptionNoLocation',
  'metaKeywords',
  'socialImageAlt',
] as const;
export type UiStringKey = (typeof UI_STRING_KEYS)[number];

/**
 * Sentence templates and the `{name}` placeholders each must contain. A
 * translation that drops one would silently lose a value on the page, so the
 * validator rejects it.
 */
export const UI_STRING_PLACEHOLDERS = {
  yearsOfExperience: ['years'],
  printLead: ['headline', 'years'],
  teamSize: ['count'],
  skillLevel: ['level', 'max'],
  pageTitle: ['name', 'headline'],
  metaDescription: ['name', 'headline', 'location'],
  metaDescriptionNoLocation: ['name', 'headline'],
  socialImageAlt: ['name', 'headline'],
} as const satisfies Partial<Record<UiStringKey, readonly string[]>>;

/**
 * Nested label maps, each keyed by every value of a union so that no value
 * can render without a label. The validator checks the keys against the same
 * arrays.
 */
export const UI_STRING_MAPS = {
  /** Display label per `EmploymentType`, instead of the raw enum value. */
  employmentTypes: EMPLOYMENT_TYPES,
  /** Heading used when a section has no entry in `sections[]`. */
  sectionTitles: SECTION_IDS,
  /** Tooltip and accessible name of the link to each language. */
  viewInLanguage: SUPPORTED_LOCALES,
} as const;
export type UiStringMapKey = keyof typeof UI_STRING_MAPS;

/** Interface strings in the dataset's own language. */
export type UiStrings = Record<UiStringKey, string> & {
  [K in UiStringMapKey]: Record<(typeof UI_STRING_MAPS)[K][number], string>;
};

export interface CvData {
  meta: CvMeta;
  ui: UiStrings;
  profile: Profile;
  contacts: ContactItem[];
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: SkillGroup[];
  projects: PersonalProject[];
  certifications: Certification[];
  languages: LanguageItem[];
  hobbies: HobbyItem[];
  sections: SectionConfig[];
}
