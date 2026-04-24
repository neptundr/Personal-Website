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

async function loadHomeData() {
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

export default async function Home() {
    const { settings, projects, education, skillIcons } = await loadHomeData();

    return (
        <div
            id="page"
            className="relative overflow-hidden"
            style={{ fontFamily: 'var(--font-codecLight)' }}
        >
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
