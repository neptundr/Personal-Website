'use client';

import React from 'react';
import {motion} from 'framer-motion';
import {
    Github,
    Linkedin,
    Mail,
    Twitter,
    FileText,
    ExternalLink,
} from 'lucide-react';
import GameOfLife from './GameOfLife';

const contactLinks = [
    {
        key: 'email',
        icon: Mail,
        label: 'Email',
        href: (s: any) => `mailto:${s.email}`,
    },
    {
        key: 'github_url',
        icon: Github,
        label: 'GitHub',
    },
    {
        key: 'linkedin_url',
        icon: Linkedin,
        label: 'LinkedIn',
    },
    {
        key: 'twitter_url',
        icon: Twitter,
        label: 'Twitter',
    },
    {
        key: 'resume_url',
        icon: FileText,
        label: 'Resume',
        download: true,
    },
];

// @ts-ignore
const ContactSection = ({settings}) => {
    return (
        <section className="relative py-32 px-12 lg:px-24 bg-black border-t border-zinc-900 overflow-hidden">
            {/* Background */}
            <GameOfLife/>

            {/* Main box */}
            <motion.div
                initial={{opacity: 0}}
                whileInView={{opacity: 1}}
                viewport={{once: true}}
                transition={{duration: 0.6}}
                className="
                    relative mx-auto max-w-4xl
                    rounded-3xl
                    bg-zinc-950/60
                    backdrop-blur-xl
                    border border-white/10
                    shadow-2xl
                    px-8 md:px-12 py-16
                "
            >
                <div
                    className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/5 to-transparent pointer-events-none"/>

                {/* Header */}
                <motion.div
                    initial={{opacity: 0, y: 20}}
                    whileInView={{opacity: 1, y: 0}}
                    viewport={{once: true}}
                    transition={{duration: 0.6}}
                    className="text-center mb-10"
                >
                    <motion.span
                        className="text-red-500/80 text-xs tracking-[0.4em] uppercase font-medium"
                        initial={{opacity: 0}}
                        whileInView={{opacity: 1}}
                        viewport={{once: true}}
                        transition={{duration: 0.6, delay: 0.1}}
                    >
                        Get in Touch
                    </motion.span>

                    <motion.h2
                        className="mt-4 text-4xl md:text-5xl lg:text-6xl font-light text-white tracking-tight"
                        initial={{opacity: 0, y: 20}}
                        whileInView={{opacity: 1, y: 0}}
                        viewport={{once: true}}
                        transition={{duration: 0.6, delay: 0.2}}
                    >
                        Let&apos;s{' '}
                        <span className="italic text-gray-300 font-serif">
              Connect
            </span>
                    </motion.h2>
                </motion.div>

                {/* Unified contact links */}
                <div className="relative z-10 flex flex-wrap justify-center gap-6 max-w-3xl mx-auto">
                    {contactLinks.map((link, index) => {
                        if (!settings?.[link.key]) return null;

                        const Icon = link.icon;
                        const href = link.href
                            ? link.href(settings)
                            : settings[link.key];

                        return (
                            <motion.a
                                key={link.key}
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={link.download}
                                initial={{opacity: 0, y: 20}}
                                whileInView={{opacity: 1, y: 0}}
                                viewport={{once: true}}
                                transition={{duration: 0.5, delay: 0.5 + index * 0.1}}
                                whileHover={{y: -4, scale: 1.02}}
                                whileTap={{scale: 0.98}}
                                className="
                                      group flex items-center gap-3
                                      px-6 py-4 rounded-xl
                                      bg-zinc-900/50
                                      border border-zinc-800/50
                                      text-gray-400
                                      transition-all duration-300
                                      hover:bg-zinc-900/80
                                      hover:text-white
                                      hover:border-zinc-700/50
                                "
                            >
                                <Icon className="w-5 h-5"/>
                                <span className="font-light tracking-wide">
                  {link.label}
                </span>
                                <ExternalLink
                                    className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity"/>
                            </motion.a>
                        );
                    })}
                </div>
            </motion.div>

            {/* Decorative glow */}
            <div
                className="absolute top-0 left-1/2 z-20 w-[600px] h-[600px] bg-red-500/3 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2"/>

            {/* Decorative bottom fade */}
            <div className="absolute bottom-0 left-0 w-full z-20 h-32 bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />
        </section>
    );
};

export default ContactSection;