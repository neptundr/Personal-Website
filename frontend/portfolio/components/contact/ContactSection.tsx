'use client';

import React, {useState} from 'react';
import {motion} from 'framer-motion';
import {
    Github,
    Linkedin,
    Mail,
    Twitter,
    FileText,
    ExternalLink,
    Download,
    Copy,
    Check,
} from 'lucide-react';
import GameOfLife from './GameOfLife';

const contactLinks = [
    {
        key: 'email',
        icon: Mail,
        label: 'Email',
        color: 'red',
        action: 'copy',
    },
    {
        key: 'github_url',
        icon: Github,
        label: 'GitHub',
        color: 'white',
        action: 'external',
    },
    {
        key: 'linkedin_url',
        icon: Linkedin,
        label: 'LinkedIn',
        color: 'blue',
        action: 'external',
    },
    {
        key: 'twitter_url',
        icon: Twitter,
        label: 'Twitter',
        color: 'sky',
        action: 'external',
    },
    {
        key: 'resume_url',
        icon: FileText,
        label: 'Resume',
        color: 'red',
        action: 'download',
    },
];

const colorClasses: Record<string, string> = {
    red: 'hover:text-red-400 hover:border-red-400/30',
    blue: 'hover:text-blue-400 hover:border-blue-400/30',
    sky: 'hover:text-sky-400 hover:border-sky-400/30',
    white: 'hover:text-white hover:border-white/30',
    yellow: 'hover:text-yellow-400 hover:border-yellow-400/30',
};

// @ts-ignore
const ContactSection = ({settings}) => {
    const [copied, setCopied] = useState(false);

    const handleCopyEmail = async () => {
        if (!settings?.email) return;
        await navigator.clipboard.writeText(settings.email);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <section className="relative py-32 px-12 lg:px-24 bg-black border-t border-zinc-900 overflow-hidden">
            <GameOfLife />

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
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

                {/* Header */}
                <div className="text-center mb-10">
                    <span className="text-red-500/80 text-xs tracking-[0.4em] uppercase font-medium">
                        Get in Touch
                    </span>
                    <h2 className="mt-4 text-4xl md:text-5xl lg:text-6xl font-codec text-white tracking-tight" style={{fontFamily: 'var(--font-codec)'}}>
                        Let&apos;s <span className=" text-gray-300" style={{fontFamily: 'var(--font-futura)'}}>Connect</span>
                    </h2>
                </div>

                {/* Links */}
                <div className="relative z-10 flex flex-wrap justify-center gap-6 max-w-3xl mx-auto">
                    {contactLinks.map((link, index) => {
                        if (!settings?.[link.key]) return null;

                        const Icon = link.icon;

                        const ActionIcon =
                            link.action === 'download'
                                ? Download
                                : link.action === 'copy'
                                ? copied
                                    ? Check
                                    : Copy
                                : ExternalLink;

                        const content = (
                            <>
                                <Icon className="w-5 h-5"/>
                                <span className="font-light tracking-wide">
                                    {link.action === 'copy' && copied
                                        ? 'Copied!'
                                        : link.label}
                                </span>
                                <ActionIcon className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity"/>
                            </>
                        );

                        if (link.action === 'copy') {
                            return (
                                <motion.button
                                    key={link.key}
                                    type="button"
                                    onClick={handleCopyEmail}
                                    initial={{opacity: 0, y: 20}}
                                    whileInView={{opacity: 1, y: 0}}
                                    viewport={{once: true}}
                                    transition={{duration: 0.5, delay: 0.5 + index * 0.1}}
                                    whileHover={{y: -4, scale: 1.02}}
                                    whileTap={{scale: 0.98}}
                                    className={`
                                        group flex items-center gap-3
                                        px-6 py-4 rounded-xl
                                        bg-zinc-900/50
                                        border border-zinc-800/50
                                        text-gray-400
                                        transition-all duration-200
                                        hover:bg-zinc-900/80
                                        ${colorClasses[link.color]}
                                    `}
                                >
                                    {content}
                                </motion.button>
                            );
                        }

                        return (
                            <motion.a
                                key={link.key}
                                href={settings[link.key]}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={link.action === 'download'}
                                initial={{opacity: 0, y: 20}}
                                whileInView={{opacity: 1, y: 0}}
                                viewport={{once: true}}
                                transition={{duration: 0.5, delay: 0.5 + index * 0.1}}
                                whileHover={{y: -4, scale: 1.02}}
                                whileTap={{scale: 0.98}}
                                className={`
                                    group flex items-center gap-3
                                    px-6 py-4 rounded-xl
                                    bg-zinc-900/50
                                    border border-zinc-800/50
                                    text-gray-400
                                    transition-all duration-200
                                    hover:bg-zinc-900/80
                                    ${colorClasses[link.color]}
                                `}
                            >
                                {content}
                            </motion.a>
                        );
                    })}
                </div>
            </motion.div>

            {/* Glow */}
            <div className="absolute top-0 left-1/2 w-[600px] h-[600px] bg-red-500/3 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2"/>
        </section>
    );
};

export default ContactSection;