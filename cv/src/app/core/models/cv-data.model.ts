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

/** 1 = beginner, 5 = expert. */
export type SkillLevel = 1 | 2 | 3 | 4 | 5;

export type EmploymentType =
  | 'full-time'
  | 'part-time'
  | 'freelance'
  | 'contract'
  | 'internship';

export type ContactType =
  | 'email'
  | 'phone'
  | 'linkedin'
  | 'github'
  | 'website'
  | 'address'
  | 'birthday'
  | 'other';

export type SectionId =
  | 'about'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'
  | 'languages'
  | 'hobbies';

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
}

export interface CvData {
  meta: CvMeta;
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
