'use client';

import dynamic from 'next/dynamic';
import type { ColorConfig } from './liquid-config';

interface Props { colorConfig?: ColorConfig }

// ssr: false must live inside a Client Component (Next.js 16 rule).
const LiquidHero = dynamic(() => import('./LiquidHero'), { ssr: false });

export default function LiquidHeroLazy({ colorConfig }: Props) {
    return colorConfig !== undefined
        ? <LiquidHero colorConfig={colorConfig} />
        : <LiquidHero />;
}
