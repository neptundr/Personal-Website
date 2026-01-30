'use client';

import React, {useState, useRef, useEffect} from 'react';
import {motion, AnimatePresence, cubicBezier} from 'framer-motion';
import type { Variants } from "framer-motion";
import {Tabs, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {X} from 'lucide-react';
import ExperienceCard from "@/components/experience/ExperienceCard";
import {useQuery} from "@tanstack/react-query";
import {api} from "@/api/client";

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

interface ExperienceSectionProps {
    items: ExperienceItem[];
    skillIcons?: { skill_name: string; icon_url: string }[];
}
const itemVariants:Variants = {
    hidden: {y: 24},
    visible: {y: 0, transition: {duration: 0.25, ease: "easeIn"}},
    exit: {opacity: 0, y: -16, transition: {duration: 0.25, ease: "easeInOut"}},
};

const ExperienceSection: React.FC<ExperienceSectionProps> = ({items}) => {
    const [filter, setFilter] = useState<'all' | 'work' | 'project' | 'achievement'>('all');
    const [skillFilter, setSkillFilter] = useState<string | null>(null);
    const [showCount, setShowCount] = useState(15);
    const [hoveredId, setHoveredId] = useState<number | null>(null);

    const {data: skillIcons = []} = useQuery({
        queryKey: ['skillIcons'],
        queryFn: () => api.entities.SkillIcon.list(),
        initialData: [],
    });
    const filterRowRef = useRef<HTMLDivElement>(null);

    const getSkillIcon = (skill: string) =>
        skillIcons.find(
            (s: { skill_name: string }) =>
                s.skill_name?.toLowerCase() === skill.toLowerCase()
        )?.icon_url;

    const safeItems = Array.isArray(items) ? items : [];

    const filteredItems = safeItems
        .filter(item => filter === 'all' || item.type === filter)
        .filter(item => !skillFilter || item.skills?.includes(skillFilter));

    const hasMore = filteredItems.length > showCount;

    useEffect(() => {
        if (!skillFilter || !filterRowRef.current) return;

        const rect = filterRowRef.current.getBoundingClientRect();
        const buffer = 60; // pixels from top/bottom to tolerate

        const isMostlyInViewport =
            rect.top >= -buffer && rect.bottom <= window.innerHeight + buffer;

        if (isMostlyInViewport) return; // skip scrolling if element is within buffer

        const handle = requestAnimationFrame(() => {
            const top = window.scrollY + rect.top - 20; // optional offset
            window.scrollTo({
                top,
                behavior: 'smooth',
            });
        });

        return () => cancelAnimationFrame(handle);
    }, [skillFilter, filteredItems.length]);

    if (!items.length) return null;

    // @ts-ignore
    return (
        <section className="relative pt-32 pb-0 px-6 md:px-12 lg:px-24 overflow-hidden">
            {/* Header */}
            <motion.div
                initial={{opacity: 0, y: 20}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true}}
                transition={{duration: 0.6, delay: 0.15}}
                className="mb-12"
            >
                <span className="text-red-500/80 text-xs tracking-[0.4em] uppercase font-medium" ref={filterRowRef}>
                    Experience
                </span>
                <h2 className="mt-4 text-4xl md:text-5xl lg:text-6xl text-white tracking-tight"
                    style={{fontFamily: 'var(--font-codec)'}}>
                    What I’ve Built
                </h2>
            </motion.div>

            {/* Filters */}
            <motion.div
                initial={{opacity: 0, y: 20}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true}}
                transition={{duration: 0.6, delay: 0.25}}
                className="mb-12"
            >
                <div className="mb-12 flex flex-wrap gap-3 items-center">
                    <Tabs value={filter} onValueChange={v => setFilter(v as any)}>
                        <TabsList className="backdrop-blur-md bg-zinc-900/50 border border-gray-400/40">
                            {['all', 'work', 'project', 'achievement'].map(v => (
                                <TabsTrigger
                                    key={v}
                                    value={v}
                                    className="
                                    text-gray-400
                                    data-[state=active]:bg-red-500/10
                                    data-[state=active]:text-red-400
                                    transition-all
                                    hover:bg-gray-500/20 hover:text-gray-300
                                "
                                >
                                    {v === 'all' ? 'All' : (v[0] ?? "").toUpperCase() + v.slice(1)}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>

                    <div className="flex flex-wrap gap-2 min-w-[200px] max-w-[300px]">
                        <AnimatePresence mode="wait" initial={false}>
                            {skillFilter ? (
                                <motion.button
                                    key={skillFilter}
                                    onClick={() => setSkillFilter(null)}
                                    className="
                                    px-4 py-2 rounded-full text-sm
                                    border border-red-500 bg-red-500/20 text-white
                                    flex items-center gap-2 backdrop-blur-2xl
                                "
                                    initial={{opacity: 0, x: -16}}
                                    animate={{opacity: 1, x: 0}}
                                    exit={{opacity: 0, x: 16}}
                                    transition={{duration: 0.25}}
                                >
                                    {getSkillIcon(skillFilter) && (
                                        <img
                                            src={getSkillIcon(skillFilter)}
                                            alt={skillFilter}
                                            className="w-5.5 h-5.5"
                                        />
                                    )}
                                    {skillFilter}
                                    <motion.div
                                        whileHover={{scale: 1.25}}
                                        transition={{type: 'spring', stiffness: 300}}
                                    >
                                        <X className="w-3 h-3"/>
                                    </motion.div>
                                </motion.button>
                            ) : (
                                <motion.div
                                    key="tip"
                                    className="px-4 py-2 text-sm text-gray-400"
                                    initial={{opacity: 0, x: -16}}
                                    animate={{
                                        opacity: 1,
                                        x: 0,
                                        color: ["#9ca3af", "#dddddd"], // gray-400 to almost white
                                    }}
                                    exit={{opacity: 0, x: 16}}
                                    transition={{
                                        duration: 0.65,
                                        repeat: Infinity,
                                        repeatType: "mirror",
                                        ease: "easeInOut",
                                        opacity: {duration: 0.25},
                                        x: {duration: 0.25},
                                    }}
                                >
                                    Tip: click on a skill badge to filter
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>

            {/* Masonry Grid */}
            {filteredItems.length === 0 ? (
                <motion.div
                    className="flex justify-center items-center text-gray-400 text-lg h-48"
                    initial={{y: 40, opacity: 0}}
                    animate={{y: 0, opacity: 1}}
                    exit={{y: 20, opacity: 0}}
                    transition={{duration: 0.25}}
                >
                    No items match this filter
                </motion.div>
            ) : (
                <div className="columns-1 md:columns-2 lg:columns-3 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filteredItems.slice(0, showCount).map(item => (
                            <motion.div
                                key={item.id}
                                layout
                                variants={itemVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="mb-6 break-inside-avoid"
                            >
                                <ExperienceCard
                                    item={item}
                                    index={0}
                                    onSkillClick={(skill) =>
                                        setSkillFilter(prev => (prev === skill ? null : skill))
                                    }
                                    dimmed={hoveredId !== null && hoveredId !== item.id}
                                    onHover={setHoveredId}
                                    currentSkillFilter={skillFilter}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Show more */}
            {hasMore && (
                <div className="flex justify-center mt-12">
                    <button
                        onClick={() => setShowCount(c => Math.min(c + 15, filteredItems.length))}
                        className="px-8 py-3 rounded-full bg-zinc-900/60 text-white/80 border border-zinc-800/50 hover:text-white"
                    >
                        Show More
                    </button>
                </div>
            )}
        </section>
    );
};

export default ExperienceSection;