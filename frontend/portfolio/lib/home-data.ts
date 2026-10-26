import { supabasePublic, TABLES } from '@/lib/supabase';
import type { Project, Education, SiteSettings } from '@/types/types';

// Shared by the classic home page (/) and the redesign (/v2) so both
// designs render from exactly the same backend data.

export interface SkillIcon {
    id: number;
    skill_name: string;
    icon_url: string;
}

export interface HomeData {
    settings: SiteSettings;
    projects: Project[];
    education: Education[];
    skillIcons: SkillIcon[];
}

export async function loadHomeData(): Promise<HomeData> {
    const client = supabasePublic();

    // Fire all four queries in parallel
    const [settingsRes, projectsRes, educationRes, skillsRes] = await Promise.all([
        client.from(TABLES.settings).select('*').limit(1).maybeSingle(),
        client.from(TABLES.projects).select('*').order('order', { ascending: true }),
        client.from(TABLES.education).select('*').order('order', { ascending: true }),
        client.from(TABLES.skills).select('*'),
    ]);

    return {
        settings: (settingsRes.data ?? {}) as SiteSettings,
        projects: (projectsRes.data ?? []) as Project[],
        education: (educationRes.data ?? []) as Education[],
        skillIcons: (skillsRes.data ?? []) as SkillIcon[],
    };
}
