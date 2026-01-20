// types/types.ts
export interface Project {
  id: number;
  title: string;
  description: string;
  type?: 'work' | 'project' | 'achievement';
  company?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  is_current?: boolean;
  image_url?: string;
  skills?: string[];
  link?: string;
  github_url?: string;
  order?: number;
  featured?: boolean;
}

export interface Education {
  id?: number;
  institution: string;
  degree: string;
  institution_url?: string;
  field?: string;
  start_year?: string;
  end_year?: string;
  description?: string;
  logo_url?: string;
  type?: 'school' | 'university';
  order?: number;
}

export interface SiteSettings {
  id?: number;
  available_for_hire?: boolean;
  hero_name?: string;
  hero_subtitle?: string;
  hero_video_url?: string;
  // love_items_text?: string;
  love_items?: string[];
  linkedin_url?: string;
  github_url?: string;
  email?: string;
  twitter_url?: string;
  resume_url?: string;
}