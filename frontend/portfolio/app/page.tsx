import React from 'react';

import LiquidHeroSection from '@/components/redesign/hero/LiquidHeroSection';
import Grain from '@/components/redesign/hero/Grain';
import HeroOverlay from '@/components/redesign/hero/HeroOverlay';

import { supabasePublic, TABLES } from '@/lib/supabase';
import type { SiteSettings } from '@/types/types';

export const revalidate = 3600;

async function loadHeroSettings(): Promise<SiteSettings> {
    const client = supabasePublic();
    const { data } = await client
        .from(TABLES.settings)
        .select('hero_center_word')
        .limit(1)
        .maybeSingle();
    return (data ?? {}) as SiteSettings;
}

export default async function Home() {
    const settings = await loadHeroSettings();
    const centerWord = settings.hero_center_word || 'CREATE';

    return (
        <div
            id="page"
            className="relative overflow-hidden"
            style={{ background: '#0A0A0C', minHeight: '100vh' }}
        >
            {/* Fluid canvas — fixed, fills viewport */}
            <LiquidHeroSection />

            {/* Film grain overlay */}
            <Grain />

            {/* Text overlay: side labels + center word */}
            <HeroOverlay centerWord={centerWord} />
        </div>
    );
}
