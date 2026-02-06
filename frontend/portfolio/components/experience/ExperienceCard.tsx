// 'use client';
import React, {useState, useRef, useEffect, useMemo} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
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
    // Touch device detection
    const [isTouch, setIsTouch] = useState(false);
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const mq = window.matchMedia('(hover: none) and (pointer: coarse)');
        setIsTouch(mq.matches);
        const handler = (e: MediaQueryListEvent) => setIsTouch(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    // Hover state
    const [hovered, setHovered] = useState(false);
    const [isStarHovered, setIsStarHovered] = useState(false);
    const [imageHovered, setImageHovered] = useState(false);
    const [viewerOpen, setViewerOpen] = useState(false);

    // Images
    const images = useMemo(() => {
        if (!item.image_url) return [];
        return item.image_url
            .split(',')
            .map(u => u.replace(/\s|\n/g, ''))
            .filter(Boolean);
    }, [item.image_url]);

    // Preload images (once)
    useEffect(() => {
        if (typeof window === 'undefined') return;
        images.forEach(src => {
            const img = new window.Image();
            img.src = src;
        });
    }, [images]);

    // Crossfade state
    const [imgIndex, setImgIndex] = useState(0);
    const [prevImgIndex, setPrevImgIndex] = useState(0);
    const [imgLoaded, setImgLoaded] = useState(false);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const imgIndexRef = useRef(imgIndex);
    imgIndexRef.current = imgIndex;
    // Only create interval once, and control with imageActive state
    const imageActive = isTouch || hovered;
    // Stable image rotation logic
    useEffect(() => {
        if (images.length <= 1) return;
        let unmounted = false;
        // Clear any previous timers
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
        // Helper to rotate to next image
        const nextImage = () => {
            setPrevImgIndex(imgIndexRef.current);
            setImgIndex((prev) => {
                const next = (prev + 1) % images.length;
                return next;
            });
            setImgLoaded(false);
        };
        // Helper to reset to index 0
        const resetToFirst = () => {
            setPrevImgIndex(imgIndexRef.current);
            setImgIndex(0);
            setImgLoaded(false);
        };
        if (imageActive) {
            if (isTouch) {
                // Random initial delay between 0-600ms, then normal interval
                const initialDelay = Math.random() * 601;
                resetTimeoutRef.current = setTimeout(() => {
                    if (unmounted) return;
                    nextImage();
                    intervalRef.current = setInterval(() => {
                        if (unmounted) return;
                        nextImage();
                    }, 2500);
                }, initialDelay);
            } else {
                // Start interval, only once
                intervalRef.current = setInterval(() => {
                    if (unmounted) return;
                    nextImage();
                }, 2500);
            }
        } else {
            // On mouse leave, if not at 0, rotate back to 0 after 2.5s
            if (imgIndexRef.current !== 0) {
                resetTimeoutRef.current = setTimeout(() => {
                    if (unmounted) return;
                    resetToFirst();
                }, 800);
            }
        }
        return () => {
            unmounted = true;
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
        };
        // Only depends on imageActive and images.length
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [imageActive, images.length]);

    // Prevent scroll when viewer open
    useEffect(() => {
        if (!viewerOpen) return;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, [viewerOpen]);


    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!cardRef.current) return;

        const el = cardRef.current;
        const resize = () => {
            const height = el.getBoundingClientRect().height;
            el.parentElement!.style.gridRowEnd =
                `span ${Math.ceil(height / 10)}`;
        };

        resize();

        const ro = new ResizeObserver(resize);
        ro.observe(el);

        return () => ro.disconnect();
    }, []);


    // Grid-friendly outer layout: block, w-full, relative
    return (
        <motion.div
            className="block w-full relative group"
            transition={{duration: 0.25, ease: 'easeOut'}}
            onMouseEnter={() => {
                setHovered(true);
                onHover(item.id);
            }}
            onMouseLeave={() => {
                setHovered(false);
                onHover(null);
            }}
            whileHover={{translateY: -6}}
        >
            {/* Card content */}
            <div
                ref={cardRef}
                className={`
                    relative overflow-hidden rounded-3xl
                    border shadow-2xl
                    backdrop-blur-2xl
                    p-6
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
                                style={{fontFamily: 'var(--font-codecBold)'}}
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
                                            <span
                                                className="text-red-50 font-medium"
                                                style={{fontFamily: 'var(--font-codec)'}}
                                            >
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
                                    className="p-2 rounded-lg bg-zinc-600/10 md:backdrop-blur-sm text-gray-400 border border-transparent hover:border-gray-500 hover:text-white hover:bg-zinc-500/30 transition-all"
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
                                    className="p-2 rounded-lg bg-zinc-600/10 md:backdrop-blur-sm text-gray-400 border border-transparent hover:border-gray-500 hover:text-white hover:bg-zinc-500/30 transition-all"
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
                                        className="p-2 rounded-lg bg-zinc-600/10 md:backdrop-blur-sm text-xs text-yellow-400 font-normal transition-all flex items-center justify-center relative border border-transparent hover:border-gray-500 hover:bg-zinc-500/30"
                                        onMouseEnter={() => setIsStarHovered(true)}
                                        onMouseLeave={() => setIsStarHovered(false)}
                                    >
                                        <span className="w-4 h-4 text-center">{'★'}</span>
                                        {/* Tooltip */}
                                        {isStarHovered && (
                                            <motion.div
                                                className="
                                                    absolute -left-11 -translate-x-1/2
                                                    bg-black text-white text-xs px-2 py-1 rounded-md
                                                    pointer-events-none
                                                    whitespace-nowrap
                                                    z-10
                                                    text-center
                                                "
                                                initial={{opacity: 0}}
                                                animate={{opacity: 1}}
                                            >
                                                Featured <br/> Experience
                                            </motion.div>
                                        )}
                                    </motion.a>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Images with stable crossfade */}
                {images.length > 0 && (
                    <div
                        className="relative aspect-video mb-4 rounded-lg overflow-hidden cursor-pointer select-none"
                        style={{minHeight: 0}}
                        onMouseEnter={() => setImageHovered(true)}
                        onMouseLeave={() => setImageHovered(false)}
                        onClick={() => {
                            setViewerOpen(true);
                            setImageHovered(false);
                            setHovered(false);
                        }}
                    >
                        {/* Initial loading spinner only once */}
                        {!hasLoadedOnce && !imgLoaded && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
                                <div
                                    className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin"/>
                            </div>
                        )}
                        {/* Crossfade images: previous and current */}
                        {images.map((src, idx) => {
                            // Only render prev and current for crossfade, others hidden
                            const isPrev = idx === prevImgIndex;
                            const isCurrent = idx === imgIndex;
                            if (!isPrev && !isCurrent) return null;
                            return (
                                <motion.img
                                    key={idx + '-' + (isPrev ? 'prev' : 'curr')}
                                    src={src}
                                    alt={item.title}
                                    draggable={false}
                                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                                    style={{
                                        zIndex: isCurrent ? 20 : 10,
                                    }}
                                    initial={{opacity: isCurrent ? 0 : 1}}
                                    animate={{
                                        opacity: isCurrent ? 1 : 0,
                                        filter: isTouch
                                            ? 'grayscale(0%) brightness(1)'
                                            : hovered
                                                ? 'grayscale(0%) brightness(1)'
                                                : dimmed
                                                    ? 'grayscale(100%) brightness(0.9)'
                                                    : 'grayscale(60%) brightness(1.2)',
                                    }}
                                    transition={{
                                        opacity: {duration: 0.4, ease: 'easeInOut'},
                                        filter: {duration: 0.25, ease: 'easeInOut'},
                                    }}
                                    onLoad={() => {
                                        if (isCurrent) {
                                            setImgLoaded(true);
                                            setHasLoadedOnce(true);
                                        }
                                    }}
                                />
                            );
                        })}
                        {/* Overlay for click-to-view */}
                        <motion.div
                            className="absolute inset-0 z-30"
                            onMouseEnter={() => setImageHovered(true)}
                            onMouseLeave={() => setImageHovered(false)}
                        >
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
                        {/* Gradient overlay for subtle effect */}
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none z-25"
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

            {/* Fullscreen Image Viewer */}
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