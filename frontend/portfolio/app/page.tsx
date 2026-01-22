'use client';

import React from 'react';
import {useQuery} from '@tanstack/react-query';
import {api} from '@/api/client';
import HeroSection from '../components/hero/HeroSection';
import ExperienceSection from '../components/experience/ExperienceSection';
import EducationSection from '../components/education/EducationSection';
import ContactSection from '../components/contact/ContactSection';
import FooterSection from '../components/footer/FooterSection';
import type {Project, Education, SiteSettings} from '@/types/types';
import {motion} from "framer-motion";
import FractalTunnel from "@/components/hero/FractalTunnel";

export default function Home() {
    // Type the returned data
    const {data: settings} = useQuery<SiteSettings>({
        queryKey: ['siteSettings'],
        queryFn: async () => {
            const list = await api.entities.SiteSettings.list();
            return list[0] || {};
        },
        initialData: {} as SiteSettings,
    });

    const {data: items} = useQuery<Project[]>({
        queryKey: ['projects'],
        queryFn: () => api.entities.Project.list(/*'order', 10*/),
        initialData: [] as Project[],
    });

    const {data: education} = useQuery<Education[]>({
        queryKey: ['education'],
        queryFn: () => api.entities.Education.list(/*'order', 10*/),
        initialData: [] as Education[],
    });

    return (
        <div className="{/*bg-black*/} min-h-screenr elative z-10">

            <HeroSection
                name={settings.hero_name || "Denis"}
                subtitle={settings.hero_subtitle}
                availableForHire={settings.available_for_hire}
                videoUrl={settings.hero_video_url}
                loveItems={settings.love_items || ["coding"]}
            />

            <ExperienceSection items={items}/>
            <EducationSection education={education}/>
            <ContactSection settings={settings}/>
            <FooterSection/>
        </div>
    );
}

