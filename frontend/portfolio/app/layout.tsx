import type {ReactNode} from 'react';
// @ts-ignore
import './globals.css';
import {codec, codecBold, codecLight} from './fonts';
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

const themeBootstrap = `(function(){try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark')t='dark';document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

export default function RootLayout({children}: { children: ReactNode }) {
    return (
        <html lang="en" data-theme="dark" className={`${codec.variable} ${codecLight.variable} ${codecBold.variable}`}>
            <head>
                <script dangerouslySetInnerHTML={{__html: themeBootstrap}} />
            </head>
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