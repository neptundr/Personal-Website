'use client';

import type {ReactNode} from 'react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
// @ts-ignore
import './globals.css';
import {futura, codec, codecLight} from './fonts';

const queryClient = new QueryClient();

export default function RootLayout({children}: { children: ReactNode }) {
    return (
        <html lang="en" className={`${futura.variable} ${codec.variable} ${codecLight.variable}`}>
        <body>
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
        </body>
        </html>
    );
}