export interface Highlight {
  value: string;
  label: string;
}

export interface SkillGroup {
  group: string;
  items: string[];
}

export interface SiteSettings {
  full_name: string;
  headline: string;
  tagline: string;
  location: string;
  email: string;
  github_url: string;
  linkedin_url: string;
  cv_url: string;
  available: boolean;
  availability_note: string;
  about: string;
  highlights: Highlight[];
  skills: SkillGroup[];
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  summary: string;
  role: string;
  year: number | null;
  status: string;
  stack: string[];
  repo_url: string;
  demo_url: string;
  problem: string;
  solution: string;
  result: string;
  cover_url: string | null;
  featured: boolean;
  published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Experience {
  id: string;
  role: string;
  company: string;
  location: string;
  period: string;
  is_current: boolean;
  summary: string;
  published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  name: string;
  email: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export const PROJECT_STATUSES = [
  "Deployed",
  "In development",
  "Contributor",
  "Archived",
] as const;
