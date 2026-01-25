'use client';

import React from 'react';
import {motion} from 'framer-motion';
import {format} from 'date-fns';
import {ExternalLink, Github} from 'lucide-react';
import SkillBadge from '../shared/SkillBadge';

interface ExperienceItem {
    id: number;
    title: string;
    company?: string;
    location?: string;
    start_date?: string;
    end_date?: string;
    is_current?: boolean;
    featured?: boolean;
    link?: string;
    github_url?: string;
    image_url?: string;
    description?: string;
    skills?: string[];
    type?: 'work' | 'project' | 'achievement';
}

interface ExperienceCardProps {
    item: ExperienceItem;
    index: number;
    onSkillClick: (skill: string | null) => void;
    dimmed: boolean;
    onHover: (id: number | null) => void;
    currentSkillFilter?: string | null;
}

const formatDate = (date?: string) => {
    if (!date) return '';
    try {
        return format(new Date(date), 'MMM yyyy');
    } catch {
        return date;
    }
};

const ExperienceCard: React.FC<ExperienceCardProps> = ({
                                                           item,
                                                           index,
                                                           onSkillClick,
                                                           dimmed,
                                                           onHover,
                                                           currentSkillFilter,
                                                       }) => {
    return (
        <motion.div
            initial={{scale: 0.84}}
            animate={{scale: 1}}
            exit={{y: -50}}
            transition={{duration: 0.25, ease: 'easeOut'}}
            className="relative group"
            onMouseEnter={() => onHover(item.id)}
            onMouseLeave={() => onHover(null)}
            whileHover={{y: -6}}
        >
             {/* STATIC BLUR LAYER */}
            {/*<div className="absolute inset-0 rounded-3xl bg-white-950/60 backdrop-blur-xs"/>*/}

            {/* CONTENT */}
            <div
                className={`
                    relative overflow-hidden rounded-3xl
                    border shadow-2xl
                    backdrop-blur-2xl
                    p-6 h-full
                    transition-[border,box-shadow,opacity] duration-300
                    hover:border-gray-50 hover:shadow-lg hover:shadow-red-500/10 hover:border-2
                    ${dimmed ? 'opacity-40 border-gray-700' : 'border-gray-400'}
                `}
            >
                {/* Subtle highlight */}
                <div
                    className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/5 to-transparent pointer-events-none"/>

                {/* Title & Meta */}
                <div className="mb-4">
                    <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                            <h3
                                className="text-3xl text-gray-200 mb-2 group-hover:text-white transition-colors"
                                style={{fontFamily: 'var(--font-codec)'}}
                            >
                                {item.title}
                                {item.featured && (
                                    <span className="ml-3 text-xs text-yellow-400 font-normal whitespace-nowrap">
                                        ★ Featured
                                    </span>
                                )}
                            </h3>

                            <div
                                className="flex flex-wrap items-center gap-3 text-sm"
                                style={{fontFamily: 'var(--font-codecLight)'}}
                            >
                                {item.company && (
                                    <span className="text-gray-300 font-normal">
                                        {item.company}
                                    </span>
                                )}
                                {item.location && (
                                    <span className="text-gray-500">{item.location}</span>
                                )}
                                {(item.start_date || item.end_date || item.is_current) && (
                                    <span className="text-gray-500">
                                        {formatDate(item.start_date)}
                                        {item.start_date &&
                                            (item.end_date || item.is_current) &&
                                            ' — '}
                                        {item.is_current ? (
                                            <span className="text-red-400 font-medium">
                                                Present
                                            </span>
                                        ) : (
                                            formatDate(item.end_date)
                                        )}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Links */}
                        <div className="flex items-center gap-2 shrink-0">
                            {item.link && (
                                <motion.a
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    whileHover={{scale: 1.1}}
                                    whileTap={{scale: 0.95}}
                                    className="p-2 rounded-lg bg-zinc-800/50 text-gray-400 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                                >
                                    <ExternalLink className="w-4 h-4"/>
                                </motion.a>
                            )}
                            {item.github_url && (
                                <motion.a
                                    href={item.github_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    whileHover={{scale: 1.1}}
                                    whileTap={{scale: 0.95}}
                                    className="p-2 rounded-lg bg-zinc-800/50 text-gray-400 hover:text-white hover:bg-zinc-800 transition-colors"
                                >
                                    <Github className="w-4 h-4"/>
                                </motion.a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Image */}
                {item.image_url && (
                    <div className="relative aspect-video mb-4 rounded-lg overflow-hidden">
                        <motion.img
                            src={item.image_url}
                            alt={item.title}
                            className="w-full h-full object-cover"
                            whileHover={{scale: 1.05}}
                            transition={{duration: 0.4}}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"/>
                    </div>
                )}

                {/* Description */}
                {item.description && (
                    <p
                        className="text-gray-400 text-sm leading-relaxed mb-4"
                        style={{fontFamily: 'var(--font-codecLight)'}}
                    >
                        {item.description}
                    </p>
                )}

                {/* Skills */}
                {item.skills && (
                    <div className="flex flex-wrap gap-2">
                        {item.skills.map((skill) => (
                            <SkillBadge
                                key={skill}
                                skill={skill}
                                size="sm"
                                isActive={currentSkillFilter === skill}
                                onClick={() =>
                                    onSkillClick(
                                        currentSkillFilter === skill ? null : skill
                                    )
                                }
                            />
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default ExperienceCard;