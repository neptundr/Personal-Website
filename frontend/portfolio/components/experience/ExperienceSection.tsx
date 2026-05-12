'use client';

import React, {useState, useRef, useEffect} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import type {Variants} from "framer-motion";
import {Tabs, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {X} from 'lucide-react';
import ExperienceCard from "@/components/experience/ExperienceCard";

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
    app_store_url?: string;
    image_url?: string;
    color_primary?: string;
    color_secondary?: string;
    description?: string;
    skills?: string[];
    type?: 'work' | 'project' | 'achievement';
}

interface ExperienceSectionProps {
    items: ExperienceItem[];
    skillIcons?: { skill_name: string; icon_url: string }[];
}

const itemVariants: Variants = {
    hidden: {opacity: 0, y: 24},
    visible: {opacity: 1, y: 0, transition: {duration: 0.25, ease: "easeIn"}},
    exit: {opacity: 0, y: -16, transition: {duration: 0.25, ease: "easeInOut"}},
};

// Safari: y+opacity simultaneously forces GPU layer creation mid-animation → flicker.
// Pure opacity runs on existing compositor layer, no new layer creation needed.
const itemVariantsSafari: Variants = {
    hidden: {opacity: 0},
    visible: {opacity: 1, transition: {duration: 0.3, ease: "easeInOut"}},
    exit: {opacity: 0, transition: {duration: 0.2, ease: "easeInOut"}},
};

const ExperienceSection: React.FC<ExperienceSectionProps> = ({items, skillIcons = []}) => {
    const [filter, setFilter] = useState<'all' | 'work' | 'project' | 'achievement'>('all');
    const [skillFilter, setSkillFilter] = useState<string | null>(null);
    const [showCount, setShowCount] = useState(50);
    const [hoveredId, setHoveredId] = useState<number | null>(null);
    const [isTouch, setIsTouch] = useState(false);
    const [isSingleColumn, setIsSingleColumn] = useState(false);
    const [touchActiveId, setTouchActiveId] = useState<number | null>(null);
    const [numCols, setNumCols] = useState(3);
    const [isWebKit, setIsWebKit] = useState(false);

    const filterRowRef = useRef<HTMLDivElement>(null);
    const cardEls = useRef<Map<number, Element>>(new Map());

    const getSkillIcon = (skill: string) =>
        skillIcons.find(
            (s: { skill_name: string }) =>
                s.skill_name?.toLowerCase() === skill.toLowerCase()
        )?.icon_url;

    const safeItems = Array.isArray(items) ? items : [];

    const noFiltersActive = filter === 'all' && !skillFilter;

    const filteredItems = safeItems
        .filter(item => noFiltersActive || !item.title.includes(' -s'))
        .filter(item => filter === 'all' || item.type === filter)
        .filter(item => !skillFilter || item.skills?.includes(skillFilter));

    const hasMore = filteredItems.length > showCount;

    // Detect Safari/WebKit — use flex-column masonry to avoid CSS columns reflow bugs
    useEffect(() => {
        const ua = navigator.userAgent;
        setIsWebKit(ua.includes('Safari') && !ua.includes('Chrome') && !ua.includes('Chromium'));
    }, []);

    // Detect touch-only device
    useEffect(() => {
        const mq = window.matchMedia('(hover: none) and (pointer: coarse)');
        setIsTouch(mq.matches);
        const handler = (e: MediaQueryListEvent) => setIsTouch(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    // Detect single-column layout (below md breakpoint = 768px)
    useEffect(() => {
        const mq = window.matchMedia('(max-width: 767px)');
        setIsSingleColumn(mq.matches);
        const handler = (e: MediaQueryListEvent) => setIsSingleColumn(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    // Track column count for flex-masonry distribution (matches Tailwind md/lg breakpoints)
    useEffect(() => {
        const update = () =>
            setNumCols(window.innerWidth >= 1280 ? 3 : window.innerWidth >= 768 ? 2 : 1);
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    // Reset active card when column count changes
    useEffect(() => {
        setTouchActiveId(null);
    }, [isSingleColumn]);

    // IntersectionObserver — lights up the most-visible card on touch (single column only)
    useEffect(() => {
        if (!isTouch || !isSingleColumn) return;

        const ratios = new Map<number, number>();
        const thresholds = Array.from({length: 11}, (_, i) => i * 0.1);

        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    const id = Number((entry.target as HTMLElement).dataset.cardId);
                    ratios.set(id, entry.intersectionRatio);
                }
                let bestId: number | null = null;
                let bestRatio = 0.15; // minimum threshold to activate
                for (const [id, ratio] of ratios) {
                    if (ratio > bestRatio) {
                        bestRatio = ratio;
                        bestId = id;
                    }
                }
                setTouchActiveId(bestId);
            },
            {threshold: thresholds}
        );

        for (const el of cardEls.current.values()) {
            observer.observe(el);
        }

        return () => observer.disconnect();
    }, [isTouch, isSingleColumn, filteredItems.length, showCount]);

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

    const effectiveHoveredId = isTouch ? touchActiveId : hoveredId;

    if (!items.length) return null;

    return (
        <section id="experience" className="relative pt-32 pb-30 px-6 md:px-12 lg:px-24 overflow-hidden">
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
                    style={{fontFamily: 'var(--font-codecBold)'}}>
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
                                    {v === 'all'
                                        ? 'All'
                                        : v === 'achievement'
                                            ? 'Side Quests'
                                                : v === 'project'
                                                    ? 'Projects'
                                                    : 'Work'
                                    }
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
                                    px-3 py-2 rounded-full text-sm
                                    border-[1.2px] border-red-500 bg-red-500/20 text-white
                                    flex items-center gap-2 backdrop-blur-2xl
                                "
                                    initial={{opacity: 0, x: -16}}
                                    animate={{opacity: 1, x: 0}}
                                    exit={{opacity: 0, x: 16}}
                                    transition={{duration: 0.25}}
                                    style={{fontFamily: 'var(--font-codecBold)'}}
                                >
                                    {getSkillIcon(skillFilter) && (
                                        <img
                                            src={getSkillIcon(skillFilter)}
                                            alt={skillFilter}
                                            className="w-4.5 h-4.5 object-contain aspect-square"
                                        />
                                    )}
                                    {skillFilter}
                                    <motion.div
                                        whileHover={{scale: 1.25}}
                                        transition={{type: 'spring', stiffness: 300}}
                                    >
                                        <X className="w-3 h-3 mr-1"/>
                                    </motion.div>
                                </motion.button>
                            ) : (
                                <motion.div
                                    key="tip"
                                    className="px-4 py-2 text-sm"
                                    // Framer handles opacity + x only.
                                    // Color pulse uses CSS @keyframes — always starts on render,
                                    // immune to FM hydration/initial-value quirks.
                                    initial={{opacity: 0, x: -16}}
                                    animate={{opacity: 1, x: 0}}
                                    exit={{opacity: 0, x: 16}}
                                    transition={{
                                        opacity: {duration: 0.25, ease: "easeInOut"},
                                        x: {duration: 0.25, ease: "easeInOut"},
                                    }}
                                    style={{animation: 'tip-color-pulse 1.3s ease-in-out infinite'}}
                                >
                                    <style>{`@keyframes tip-color-pulse{0%,100%{color:#9ca3af}50%{color:#dddddd}}`}</style>
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
                    className="max-w-sm"
                    initial={{y: 40, opacity: 0}}
                    animate={{y: 0, opacity: 1}}
                    exit={{y: 20, opacity: 0}}
                    transition={{duration: 0.25}}
                >
                    <ExperienceCard
                        item={{
                            id: -1,
                            title: 'Nothing found 🌚',
                            description: 'Nothing showed up for this filter – try adjusting your selection.',
                        }}
                        index={0}
                        onSkillClick={() => {}}
                        dimmed={false}
                        onHover={() => {}}
                        currentSkillFilter={null}
                        skillIcons={skillIcons}
                    />
                </motion.div>
            ) : isWebKit ? (
                /* ── WebKit/Safari: flex-column masonry ──
                   CSS columns + AnimatePresence(popLayout) causes first-row flicker
                   and card render glitches in Safari. Real flex column divs avoid
                   the CSS columns reflow entirely. */
                <div className="flex gap-6 items-start">
                    {Array.from({length: numCols}, (_, colIdx) => (
                        <div key={colIdx} className="flex-1 flex flex-col gap-6 min-w-0">
                            <AnimatePresence mode="sync">
                                {filteredItems
                                    .slice(0, showCount)
                                    .filter((_, i) => i % numCols === colIdx)
                                    .map((item, index) => (
                                        <motion.div
                                            key={item.id}
                                            variants={itemVariantsSafari}
                                            initial="hidden"
                                            animate="visible"
                                            exit="exit"
                                            data-card-id={item.id}
                                            ref={(el) => {
                                                if (el) cardEls.current.set(item.id, el);
                                                else cardEls.current.delete(item.id);
                                            }}
                                            onClick={isTouch && !isSingleColumn
                                                ? () => setTouchActiveId(prev => prev === item.id ? null : item.id)
                                                : undefined
                                            }
                                        >
                                            <ExperienceCard
                                                item={item}
                                                index={index}
                                                onSkillClick={(skill) => {
                                                    setSkillFilter(prev => (prev === skill ? null : skill));
                                                    setFilter('all');
                                                }}
                                                dimmed={effectiveHoveredId !== null && effectiveHoveredId !== item.id}
                                                onHover={setHoveredId}
                                                currentSkillFilter={skillFilter}
                                                skillIcons={skillIcons}
                                                scrollActive={isTouch && touchActiveId === item.id}
                                            />
                                        </motion.div>
                                    ))}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            ) : (
                /* ── All other browsers: CSS columns + layout animations ── */
                <div className="columns-1 md:columns-2 lg:columns-3 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filteredItems.slice(0, showCount).map((item, index) => (
                            <motion.div
                                key={item.id}
                                layout
                                variants={itemVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="mb-6 break-inside-avoid"
                                data-card-id={item.id}
                                ref={(el) => {
                                    if (el) cardEls.current.set(item.id, el);
                                    else cardEls.current.delete(item.id);
                                }}
                                onClick={isTouch && !isSingleColumn
                                    ? () => setTouchActiveId(prev => prev === item.id ? null : item.id)
                                    : undefined
                                }
                            >
                                <ExperienceCard
                                    item={item}
                                    index={index}
                                    onSkillClick={(skill) => {
                                        setSkillFilter(prev => (prev === skill ? null : skill));
                                        setFilter('all');
                                    }}
                                    dimmed={effectiveHoveredId !== null && effectiveHoveredId !== item.id}
                                    onHover={setHoveredId}
                                    currentSkillFilter={skillFilter}
                                    skillIcons={skillIcons}
                                    scrollActive={isTouch && touchActiveId === item.id}
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
                        onClick={() => setShowCount(c => Math.min(c + 50, filteredItems.length))}
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