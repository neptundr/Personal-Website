'use client';

import React from 'react';
import {motion} from 'framer-motion';
import Image from 'next/image';
import {useTheme} from '@/components/theme/ThemeProvider';

interface Education {
    type: 'university' | 'school';
    institution: string;
    institution_url?: string;
    start_year: number | string;
    end_year?: number | string;
    degree?: string;
    description?: string;
    logo_url?: string;
}

interface EducationCardProps {
    education: Education;
    index: number;
}

const EducationCard: React.FC<EducationCardProps> = ({education, index}) => {
    const {theme} = useTheme();
    const hoverShadow = theme === 'dark'
        ? '0 0 40px 5px rgba(255,255,255,0.5)'
        : '0 0 30px 8px rgba(20,24,33,0.10)';

    return (
        <motion.div
            initial={{opacity: 0, y: 40}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true, margin: '-50px'}}
            transition={{duration: 0.25, delay: 0.15*index, ease: 'easeOut', type: "spring", damping: 9, stiffness: 180}}
            whileHover={{
                y: -6,
                boxShadow: hoverShadow,
                borderRadius: '1.5rem'
            }}
            className="group relative"
        >
            <div
                className="relative flex overflow-hidden outline-1 shadow-2xl
                bg-[var(--card-bg)] rounded-3xl h-full
                transition-all duration-300 outline-[var(--card-outline)]
                hover:outline-[var(--card-hover-outline)] hover:shadow-lg hover:shadow-red-500/10 hover:outline-4"
            >
                {/* LEFT COLUMN */}
                <div className="p-3 sm:p-3 md:p-3 flex flex-col items-start">
                    {education.logo_url && (
                        <a
                            href={education.institution_url}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <div
                                className="
                                    w-36 h-36
                                    sm:w-36 sm:h-36
                                    md:w-42 md:h-42
                                    lg:w-60 lg:h-60
                                    rounded-xl bg-white
                                    flex items-center justify-center shrink-0
                                    hover:opacity-85
                                    transition-all duration-300
                                "
                                style={{aspectRatio: '1 / 1'}}
                            >
                                <Image
                                    src={education.logo_url}
                                    alt={education.institution}
                                    width={120}
                                    height={120}
                                    className="w-28 h-28 md:w-32 md:h-32 lg:w-44 lg:h-44 object-contain"
                                    unoptimized={education.logo_url.endsWith('.svg')}
                                />
                            </div>
                        </a>
                    )}
                </div>

                {/* RIGHT COLUMN */}
                <div className="flex flex-col flex-1 pl-2 pt-4 sm:pt-3 md:pt-4.5 ">
                    <a
                        href={education.institution_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="
                            flex flex-wrap items-baseline
                            text-lg md:text-3xl text-[var(--card-text)]
                            hover:text-[var(--card-text-sub)] transition-colors duration-300
                        "
                        style={{fontFamily: 'var(--font-codecBold)'}}
                    >
                        <span className="whitespace-nowrap pr-4 ">
                            {education.institution} {" "}
                        </span>

                        <span className="text-[var(--card-text-muted)] whitespace-nowrap pr-5">
                            {education.start_year} — {education.end_year || 'Present'}
                        </span>
                    </a>

                    <div className="border-t border-[var(--card-divider)] my-3"/>

                    {education.description && (
                        <p className="text-[var(--card-text-muted)] text-sm leading-relaxed pb-3 pr-5">
                            {education.description}
                        </p>
                    )}
                </div>

                {/* Subtle glow */}
                <div
                    className="absolute inset-0 rounded-3xl bg-gradient-to-b from-[var(--card-glow-from)] to-transparent pointer-events-none"/>
            </div>
        </motion.div>
    );
};

export default EducationCard;