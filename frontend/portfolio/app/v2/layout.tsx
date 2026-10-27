import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { funnelDisplay } from './fonts';
// @ts-ignore
import './v2.css';

// Redesign in progress. Lives under the shared root layout (Providers,
// analytics) but owns all of its own fonts, tokens and styles.
// Access is gated to admins in proxy.ts; noindex keeps it out of search
// results if it ever leaks.
export const metadata: Metadata = {
    title: 'Denis Kaizer · Portfolio (v2 preview)',
    robots: { index: false, follow: false },
};

export default function V2Layout({ children }: { children: ReactNode }) {
    return <div className={`v2-root ${funnelDisplay.variable}`}>{children}</div>;
}
