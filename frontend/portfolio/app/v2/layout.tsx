import type { ReactNode } from 'react';
import type { Metadata } from 'next';
// @ts-ignore
import './v2.css';

// Redesign in progress. Lives under the shared root layout (Providers,
// analytics, base Tailwind) but owns its own tokens and styles via v2.css.
// Access is gated to admins in proxy.ts; noindex keeps it out of search
// results if it ever leaks.
export const metadata: Metadata = {
    title: 'Denis Kaizer · Portfolio (v2 preview)',
    robots: { index: false, follow: false },
};

export default function V2Layout({ children }: { children: ReactNode }) {
    return <div className="v2-root">{children}</div>;
}
