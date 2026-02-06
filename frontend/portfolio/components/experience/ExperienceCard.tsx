'use client';

import React, {useState} from 'react';
import {motion, AnimatePresence, hover} from 'framer-motion';
import {format} from 'date-fns';
import {ExternalLink, Github} from 'lucide-react';
import SkillBadge from '../shared/SkillBadge';
import FullscreenImageViewer from "@/components/viewer/FullscreenImageViewer";

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
    const [hovered, setHovered] = useState(false);
    const [isStarHovered, setIsStarHovered] = React.useState(false);
    const [prevImgIndex, setPrevImgIndex] = useState<number>(0);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

    const images = React.useMemo(() => {
        if (!item.image_url) return [];
        return item.image_url
            .split(',')
            .map(u => u.replace(/\s|\n/g, ''))
            .filter(Boolean);
    }, [item.image_url]);

    const [imgIndex, setImgIndex] = useState(0);
    const [imgLoaded, setImgLoaded] = useState(false);
    const [imageHovered, setImageHovered] = useState(false);
    const [viewerOpen, setViewerOpen] = useState(false);

    const [isTouch, setIsTouch] = React.useState(false);

    React.useEffect(() => {
        const mq = window.matchMedia('(hover: none) and (pointer: coarse)');
        setIsTouch(mq.matches);

        const handler = (e: MediaQueryListEvent) => setIsTouch(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    const imageActive = isTouch || hovered;

    // Preload all images and prepare for smooth first transition
    React.useEffect(() => {
        if (images.length <= 1) return;

        // preload all images
        images.forEach((src) => {
            const img = new Image();
            img.src = src;
        });

        // set prevImgIndex to last image so first crossfade is smooth
        setPrevImgIndex(images.length - 1);
    }, [images]);

    React.useEffect(() => {
        if (!imageActive || images.length <= 1) return;

        let intervalId: ReturnType<typeof setInterval> | null = null;
        let timeoutId: ReturnType<typeof setTimeout> | null = null;

        const startInterval = () => {
            intervalId = setInterval(() => {
                setImgIndex((prevIndex) => {
                    const nextIndex = (prevIndex + 1) % images.length;

                    const img = new Image();
                    img.src = images[nextIndex] ?? "";

                    setPrevImgIndex(prevIndex);
                    setImgLoaded(false);

                    return nextIndex;
                });
            }, 2500);
        };

        // random delay only before the first change
        const initialDelay = Math.random() * 600;

        timeoutId = setTimeout(() => {
            setImgIndex((prevIndex) => {
                const nextIndex = (prevIndex + 1) % images.length;

                const img = new Image();
                img.src = images[nextIndex] ?? "";

                setPrevImgIndex(prevIndex);
                setImgLoaded(false);

                return nextIndex;
            });

            startInterval();
        }, initialDelay);

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
            if (intervalId) clearInterval(intervalId);
        };
    }, [imageActive, images]);

    React.useEffect(() => {
        if (!viewerOpen) return;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, [viewerOpen]);

    return (
        <motion.div
            // initial={{scale: 0.84}}
            // animate={{scale: 1}}
            // exit={{y: -50}}
            transition={{duration: 0.25, ease: 'easeOut'}}
            className="relative group"
            onMouseEnter={() => {
                setHovered(true);
                onHover(item.id);
            }}
            onMouseLeave={() => {
                setHovered(false);
                onHover(null);
            }}
            whileHover={{y: -6}}
        >
            {/* CONTENT */}
            <div
                className={`
                    relative overflow-hidden rounded-3xl
                    border shadow-2xl
                    backdrop-blur-2xl
                    p-6 h-full
                    transition-[border,box-shadow,opacity] duration-300
                    hover:border-gray-50 hover:shadow-lg hover:shadow-red-500/10 hover:border-2
                    ${dimmed ? 'opacity-93 border-gray-700' : 'border-gray-400'}
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
                                            <span className="text-red-50 font-medium"
                                                  style={{fontFamily: 'var(--font-codec)'}}>
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
                                    className="p-2 rounded-lg bg-zinc-600/10 backdrop-blur-sm text-gray-400 border border-transparent hover:border-gray-500 hover:text-white hover:bg-zinc-500/30 transition-all"
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
                                    className="p-2 rounded-lg bg-zinc-600/10 backdrop-blur-sm text-gray-400 border border-transparent hover:border-gray-500 hover:text-white hover:bg-zinc-500/30 transition-all"
                                >
                                    <Github className="w-4 h-4"/>
                                </motion.a>
                            )}
                            {item.featured && (
                                <motion.div className="relative">
                                    <motion.a
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        whileHover={{scale: 1.1}}
                                        whileTap={{scale: 0.95}}
                                        className="p-2 rounded-lg bg-zinc-600/10 backdrop-blur-sm text-xs text-yellow-400 font-normal transition-all flex items-center justify-center relative border border-transparent hover:border-gray-500 hover:bg-zinc-500/30"
                                        onMouseEnter={() => setIsStarHovered(true)}
                                        onMouseLeave={() => setIsStarHovered(false)}
                                    >
                                        <span className="w-4 h-4 text-center text-">
                                             {'★'}
                                        </span>

                                        {/* Tooltip */}
                                        {isStarHovered && (
                                            <div className="
                                                absolute -left-11 -translate-x-1/2
                                                bg-black text-white text-xs px-2 py-1 rounded-md
                                                pointer-events-none
                                                whitespace-nowrap
                                                z-10
                                                text-center
                                            ">
                                                Featured <br/> Experience
                                            </div>
                                        )}
                                    </motion.a>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Image */}
                {images.length > 0 && (
                    <div
                        className="relative aspect-video mb-4 rounded-lg overflow-hidden cursor-pointer"
                        onMouseEnter={() => setImageHovered(true)}
                        onMouseLeave={() => setImageHovered(false)}
                        onClick={() => {
                            setViewerOpen(true);
                            setImageHovered(false);
                            setHovered(false)
                        }}
                    >

                        {/* Initial loading spinner only once */}
                        {!hasLoadedOnce && !imgLoaded && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-5">
                                <div
                                    className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin"/>
                            </div>
                        )}

                        {/* Previous image (background layer) */}
                        <img
                            src={images[prevImgIndex]}
                            className="absolute inset-0 w-full h-full object-cover z-9"
                            draggable={false}
                        />

                        {/* Current image (animated layer) */}
                        <motion.img
                            key={imgIndex}
                            src={images[imgIndex]}
                            alt={item.title}
                            className="absolute inset-0 w-full h-full object-cover z-10"
                            draggable={false}
                            onLoad={() => {
                                setImgLoaded(true);
                                setHasLoadedOnce(true);
                            }}
                            initial={{opacity: 0, filter: 'blur(3px)'}}
                            animate={{
                                opacity: 1,
                                filter: isTouch
                                    ? 'grayscale(0%) blur(0px) brightness(1)'
                                    : hovered
                                        ? 'grayscale(0%) blur(0px) brightness(1)'
                                        : dimmed
                                            ? 'grayscale(100%) blur(0px) brightness(0.9)'
                                            : 'grayscale(60%) blur(0px) brightness(1.2)',
                            }}
                            transition={{duration: 0.35, ease: 'easeIn'}}
                        />

                        <motion.div
                            className="absolute inset-0 z-20"
                            onMouseEnter={() => setImageHovered(true)}
                            onMouseLeave={() => setImageHovered(false)}
                        >
                            {/* visual overlay */}
                            <motion.div
                                className="absolute inset-0 flex items-center justify-center rounded-lg
                                bg-black/50 backdrop-blur-md pointer-events-none
                                will-change-opacity transform-gpu"
                                animate={{opacity: imageHovered ? 1 : 0}}
                                transition={{duration: 0.35, ease: 'easeOut'}}
                            >
                                <motion.span
                                    className="text-white text-sm tracking-wide"
                                    style={{fontFamily: 'var(--font-codecLight)'}}
                                    initial={{opacity: 0}}
                                    animate={{
                                        opacity: imageHovered ? 1 : 0,
                                        y: imageHovered ? 0 : 6,
                                    }}
                                    transition={{duration: 0.35, ease: 'easeOut'}}
                                >
                                    Click to open fullscreen
                                </motion.span>
                            </motion.div>
                        </motion.div>


                        <motion.div
                            className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none z-15"
                            initial={{opacity: 1}}
                            animate={{opacity: isTouch || hovered ? 0 : 1}}
                            transition={{duration: 0.5, ease: 'easeOut'}}
                        />
                    </div>
                )}

                {/* Description */}
                {item.description && item.description.split('\n').map((para, i) => (
                    <p
                        key={i}
                        className="text-gray-400 text-sm mb-3 whitespace-pre-wrap"
                        style={{fontFamily: 'var(--font-codecLight)'}}
                    >
                        {para}
                    </p>
                ))}

                {/* Skills */}
                {item.skills && (
                    <div className="flex flex-wrap mt-4.5 gap-2">
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

            <AnimatePresence>
                {viewerOpen && (
                    <FullscreenImageViewer
                        images={images}
                        startIndex={imgIndex}
                        onClose={() => setViewerOpen(false)}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default ExperienceCard;