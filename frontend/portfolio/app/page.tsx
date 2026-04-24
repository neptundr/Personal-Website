import React from 'react';

import HeroSection from '../components/hero/HeroSection';
import ExperienceSection from '../components/experience/ExperienceSection';
import EducationSection from '../components/education/EducationSection';
import ContactSection from '../components/contact/ContactSection';
// FractalTunnel is a client-only canvas; this thin wrapper lazily loads it
// (ssr: false) from inside a Client Component.
import FractalTunnel from '@/components/hero/FractalTunnelLazy';

import { supabasePublic, TABLES } from '@/lib/supabase';
import type { Project, Education, SiteSettings } from '@/types/types';

// ISR: re-fetch from Supabase at most once per hour. Content is always present
// in the HTML on first byte.
export const revalidate = 3600;

interface SkillIcon {
    id: number;
    skill_name: string;
    icon_url: string;
}

interface LoadResult {
    settings: SiteSettings;
    projects: Project[];
    education: Education[];
    skillIcons: SkillIcon[];
    /** Non-empty only when one or more queries failed. Visible in non-production. */
    errors: string[];
}

async function loadHomeData(): Promise<LoadResult> {
    const client = supabasePublic();

    // Fire all four queries in parallel
    const [settingsRes, projectsRes, educationRes, skillsRes] = await Promise.all([
        client.from(TABLES.settings).select('*').limit(1).maybeSingle(),
        client.from(TABLES.projects).select('*').order('order', { ascending: true }),
        client.from(TABLES.education).select('*').order('order', { ascending: true }),
        client.from(TABLES.skills).select('*'),
    ]);

    // Collect errors — they show in Vercel Function logs and in the preview banner
    const errors: string[] = [];
    for (const [label, res] of [
        ['site_settings', settingsRes],
        ['projects', projectsRes],
        ['education', educationRes],
        ['skill_icons', skillsRes],
    ] as [string, { error: { message: string } | null }][]) {
        if (res.error) {
            const msg = `[${label}] ${res.error.message}`;
            console.error('[loadHomeData]', msg);
            errors.push(msg);
        }
    }

    return {
        settings: (settingsRes.data ?? {}) as SiteSettings,
        projects: (projectsRes.data ?? []) as Project[],
        education: (educationRes.data ?? []) as Education[],
        skillIcons: (skillsRes.data ?? []) as SkillIcon[],
        errors,
    };
}

export default async function Home() {
    const { settings, projects, education, skillIcons, errors } = await loadHomeData();

    const isDev = process.env.NODE_ENV !== 'production';

    return (
        <div
            id="page"
            className="relative overflow-hidden"
            style={{ fontFamily: 'var(--font-codecLight)' }}
        >
            {/* Debug banner — only rendered outside production */}
            {isDev && errors.length > 0 && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
                    background: '#7f1d1d', color: '#fef2f2', padding: '12px 16px',
                    fontFamily: 'monospace', fontSize: '13px', lineHeight: 1.5,
                }}>
                    <strong>⚠ Supabase errors (remove /api/debug + this banner after fixing):</strong>
                    <ul style={{ margin: '4px 0 0', paddingLeft: '20px' }}>
                        {errors.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                </div>
            )}
            {/* Background */}
            <FractalTunnel />

            {/* Foreground */}
            <main className="relative z-10">
                <HeroSection
                    name={settings.hero_name || 'Denis'}
                    availableForHire={settings.available_for_hire ?? true}
                    loveItems={settings.love_items || ['Create']}
                />
                <ExperienceSection items={projects} skillIcons={skillIcons} />
                <EducationSection education={education} />
                <ContactSection settings={settings} />
            </main>
        </div>
    );
}
