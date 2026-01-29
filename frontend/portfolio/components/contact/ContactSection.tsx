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
import RotatingText from "@/components/hero/RotatingText";
import FooterSection from "@/components/footer/FooterSection";

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
    red: 'hover:text-red-400 hover:border-red-300',
    blue: 'hover:text-blue-400 hover:border-blue-300',
    sky: 'hover:text-sky-400 hover:border-sky-300',
    white: 'hover:text-white hover:border-gray-300',
    yellow: 'hover:text-yellow-400 hover:border-yellow-300',
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
        <section
            className="
            relative
            h-screen min-h-screen max-h-screen
            bg-black
            border-t border-zinc-900
            overflow-hidden
            flex flex-col
            "
        >
            <div
                className="
                    relative
                    flex-1 flex flex-col justify-center
                    px-12 lg:px-24
                    border-t border-zinc-900
                    overflow-hidden
                "
            >
                <div
                    className="
                        pointer-events-none
                        absolute top-0 left-0
                        w-full h-15
                        bg-gradient-to-b
                        from-black
                        to-transparent
                        z-20
                    "
                />
                <GameOfLife/>

                <motion.div
                    initial={{opacity: 0}}
                    whileInView={{opacity: 1}}
                    viewport={{once: true}}
                    transition={{duration: 0.6, delay: 0.15}}
                    className="
                        z-20
                        relative mx-auto
                        w-fit
                        rounded-3xl
                        bg-zinc-950/60
                        backdrop-blur-xl
                        border border-white/10
                        shadow-2xl
                        mt-12
                        px-8 md:px-12 pt-8 pb-12 md:pt-12 md:pb-12
                    "
                >
                    <div className="
                        absolute inset-0 rounded-3xl
                        bg-gradient-to-b from-white/5 to-transparent
                        pointer-events-none
                        backdrop-blur-2xl
                        border border-gray-400
                        -z-10
                    "/>

                    {/* Header */}
                    <div className="text-center mb-10">
                        <span className="text-red-500/80 text-xs tracking-[0.4em] uppercase font-medium">
                            Get in Touch
                        </span>

                        <h2
                            className="mt-4 font-codec text-4xl md:text-5xl lg:text-6xl text-white tracking-tight whitespace-nowrap"
                            style={{fontFamily: 'var(--font-codec)'}}
                        >
                            Let's Connect
                        </h2>
                    </div>

                    {/* Links */}
                    <div
                        className="
                            relative z-10
                            grid gap-6
                            grid-cols-1
                            sm:grid-cols-2
                            lg:grid-cols-4
                            justify-items-center
                        "
                    >
                        {contactLinks.map((link, index) => {
                            if (!settings?.[link.key]) return null;

                            const Icon = link.icon;
                            const ActionIcon =
                                link.action === 'download'
                                    ? Download
                                    : link.action === 'copy'
                                        ? copied ? Check : Copy
                                        : ExternalLink;

                            const content = (
                                <>
                                    <Icon className="w-5 h-5"/>
                                    <span className="font-light tracking-wide">
                                             {link.action === 'copy' && copied ? 'Copied!' : link.label}
                                         </span>
                                    <ActionIcon
                                        className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity"/>
                                </>
                            );

                            const baseClasses = `
                                group flex items-center gap-3
                                px-6 py-4 rounded-xl
                                w-44
                                justify-center
                                bg-zinc-900/50
                                text-gray-200
                                transition-all duration-200
                                backdrop-blur-2xl
                                border border-gray-400
                                ${colorClasses[link.color]}
                            `;

                            if (link.action === 'copy') {
                                return (
                                    <motion.button
                                        key={link.key}
                                        type="button"
                                        onClick={handleCopyEmail}
                                        initial={{opacity: 0, y: 20}}
                                        whileInView={{opacity: 1, y: 0}}
                                        viewport={{once: true}}
                                        transition={{duration: 0.5, delay: 0.45 + index * 0.15}}
                                        whileTap={{scale: 0.98}}
                                        className={baseClasses}
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
                                    transition={{duration: 0.5, delay: 0.45 + index * 0.15}}
                                    whileTap={{scale: 0.98}}
                                    className={baseClasses}
                                >
                                    {content}
                                </motion.a>
                            );
                        })}
                    </div>
                </motion.div>

                <motion.div
                    initial={{opacity: 0}}
                    whileInView={{opacity: 1}}
                    viewport={{once: true}}
                    transition={{duration: 0.6, delay: 2.5}}
                    className="
                        relativetop-1/2
                        mx-auto max-w-4xl
                        pt-10 md:pt-20
                        bottom-20
                        z-20
                    "
                >
                    <div className="w-full flex justify-center">
                        {/* Wrapper defines the central vertical axis */}
                        <div className="grid grid-cols-2 w-full max-w-5xl">

                            <h2
                                className="col-span-2 mt-4 font-codec text-white tracking-tight"
                                style={{fontFamily: 'var(--font-codec)'}}
                            >
                                {/* FIRST LINE */}
                                <div className="grid grid-cols-2 items-center text-3xl md:text-5xl lg:text-6xl">
                                    {/* Left side — flush to center */}
                                    <div className="flex justify-end pr-2">
                                        <span className={"whitespace-nowrap"}>Have a</span>
                                    </div>

                                    {/* Right side — flush to center */}
                                    <div className="flex justify-start pl-2">
                                        <RotatingText
                                            items={['truly', 'distinctly', 'deeply', 'remarkably', 'surprisingly', 'highly']}
                                            showLine={false}
                                            intervalMs={3500}
                                            vertical={false}
                                            altDir={true}
                                            textClassName="inline-block"
                                        />
                                    </div>
                                </div>

                                {/* SECOND LINE */}
                                <div className="grid grid-cols-2 items-center text-3xl md:text-5xl lg:text-6xl mt-2">
                                    {/* Left side — rotating text hugs center */}
                                    <div className="flex justify-end pr-2">
                                        <RotatingText
                                            items={['unforgettable', 'beautiful', 'mesmerizing', 'meaningful', 'fulfilling', 'well-lived']}
                                            showLine={false}
                                            delayMs={250}
                                            intervalMs={3500}
                                            vertical={false}
                                            textClassName="inline-block left-a right-0 text-right"
                                        />
                                    </div>

                                    <div className="flex justify-start pl-2">
                                        <span className={"whitespace-nowrap"}>
                                            {new Date().toLocaleDateString('en-US', {weekday: 'long'})}
                                            <motion.span
                                                className="inline-block ml-1"
                                                initial={{y: 0, scale: 1}}
                                                animate={{y: [0, -15, 0], scale: [1, 1.1, 1]}}
                                                transition={{
                                                    y: {
                                                        duration: 0.4345,
                                                        delay: 1.45,
                                                        times: [0, 0.35, 1],
                                                        ease: 'easeInOut',
                                                        repeat: Infinity,
                                                        repeatDelay: 3.5 - 0.35,
                                                    },
                                                    scale: {
                                                        duration: 0.4345,
                                                        delay: 1.45,
                                                        times: [0, 0.5, 1],
                                                        ease: 'easeInOut',
                                                        repeat: Infinity,
                                                        repeatDelay: 3.5 - 0.35,
                                                    }
                                                }}
                                            >
                                                !
                                            </motion.span>
                                        </span>
                                    </div>
                                </div>
                            </h2>
                        </div>
                    </div>
                </motion.div>

                {/* Glow */}
                <div
                    className="absolute z-8 bottom-0 left-1/2 w-[600px] h-[600px] bg-red-400/30 rounded-full blur-3xl pointer-events-none -translate-x-1/2 translate-y-1/2"/>
                <div
                    className="absolute z-8 bottom-0 left-1/2 w-[2000px] h-[300px] bg-red-400/30 rounded-full blur-3xl pointer-events-none -translate-x-1/2 translate-y-1/2"/>
                <div
                    className="absolute z-8 bottom-0 left-1/2 w-[2000px] h-[2000px]  bg-gradient-to-b
                        from-transparent
                        to-red-400/20 rounded-full backdrop-blur-3xlxl pointer-events-none -translate-x-1/2 translate-y-1/2"/>

                <div
                    className="
                        pointer-events-none
                        absolute bottom-0 left-0
                        w-full h-15
                        bg-gradient-to-b
                        from-transparent
                        to-black
                        z-9
                    "
                />
            </div>
            <div className="relative z-10">
                <FooterSection/>
            </div>
        </section>
    );
};

export default ContactSection;