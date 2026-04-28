import type {ReactNode} from 'react';
// @ts-ignore
import './globals.css';
import {codec, codecBold, codecLight, anelka} from './fonts';
import Providers from './providers';
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"

export const metadata = {
    title: 'Denis Kaizer · Portfolio',
    description: 'A showcase of my developer journey and standout projects',

    icons: {
        icon: [
            {url: '/favicon.ico'},
            {url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png'},
            {url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png'},
        ],
        apple: [
            {url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png'},
        ],
        other: [
            {
                rel: 'android-chrome',
                url: '/android-chrome-192x192.png',
            },
            {
                rel: 'android-chrome',
                url: '/android-chrome-512x512.png',
            },
        ],
    },
};

export default function RootLayout({children}: { children: ReactNode }) {
    return (
        <html lang="en" className={`${codec.variable} ${codecLight.variable} ${codecBold.variable} ${anelka.variable}`}>
            <body>
                <Providers>
                    {children}
                </Providers>
                <Analytics />
                <SpeedInsights />
            </body>
        </html>
    );
}