'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';

import HeroSection from '../components/hero/HeroSection';
import ExperienceSection from '../components/experience/ExperienceSection';
import EducationSection from '../components/education/EducationSection';
import ContactSection from '../components/contact/ContactSection';
import FooterSection from '../components/footer/FooterSection';
import FractalTunnel from '@/components/hero/FractalTunnel';

import type { Project, Education, SiteSettings } from '@/types/types';

export default function Home() {
    const { data: settings } = useQuery<SiteSettings>({
        queryKey: ['siteSettings'],
        queryFn: async () => {
            const list = await api.entities.SiteSettings.list();
            return list[0] || {};
        },
        initialData: {} as SiteSettings,
    });

    const { data: items } = useQuery<Project[]>({
        queryKey: ['projects'],
        queryFn: () => api.entities.Project.list(),
        initialData: [] as Project[],
    });

    const { data: education } = useQuery<Education[]>({
        queryKey: ['education'],
        queryFn: () => api.entities.Education.list(),
        initialData: [] as Education[],
    });

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
                    availableForHire={settings.available_for_hire ?? false}
                    loveItems={settings.love_items || ['Create']}
                />
                <ExperienceSection items={items} />
                <EducationSection education={education} />
                <ContactSection settings={settings} />
                <FooterSection />
            </main>
        </div>
    );
}