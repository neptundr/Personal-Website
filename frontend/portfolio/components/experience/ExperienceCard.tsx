'use client';

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
    app_store_url?: string;
    image_url?: string;
    description?: string;
    skills?: string[];
    type?: 'work' | 'project' | 'achievement';
    color_primary?: string;
    color_secondary?: string;
}

interface ExperienceCardProps {
    item: ExperienceItem;
    index: number;
    onSkillClick: (skill: string | null) => void;
    dimmed: boolean;
    onHover: (id: number | null) => void;
    currentSkillFilter?: string | null;
    skillIcons?: { skill_name: string; icon_url: string }[];
}

const formatDate = (date?: string) => {
    if (!date) return '';
    try {
        return format(new Date(date), 'MMM yyyy');
    } catch {
        return date;
    }
};

// PNG icons rendered as CSS masks so they inherit currentColor
const maskStyle = (url: string): React.CSSProperties => ({
    maskImage: `url(${url})`,
    maskSize: 'contain',
    maskRepeat: 'no-repeat',
    maskPosition: 'center',
    WebkitMaskImage: `url(${url})`,
    WebkitMaskSize: 'contain',
    WebkitMaskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center',
});

const AppStoreIcon = () => (
    <span className="w-4 h-4 inline-block bg-current" style={maskStyle('/icons/app-store.png')}/>
);
const StarIcon = () => (
    <span className="w-4 h-4 inline-block bg-current" style={maskStyle('/icons/star.png')}/>
);

const hexToRgba = (hex: string, alpha: number): string => {
    try {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    } catch {
        return `rgba(255, 255, 255, ${alpha})`;
    }
};

/* ── Scrolling marquee info badge ──
   No edge fades — text appears/disappears at card border via overflow:hidden.
   When text fits, renders statically. */
const InfoBadge: React.FC<{ text: string; primaryColor: string }> = ({text, primaryColor}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const measureRef = useRef<HTMLSpanElement>(null);
    const [needsMarquee, setNeedsMarquee] = useState(false);
    const [textWidth, setTextWidth] = useState(0);

    useEffect(() => {
        if (!containerRef.current || !measureRef.current) return;
        const check = () => {
            if (!containerRef.current || !measureRef.current) return;
            const tW = measureRef.current.scrollWidth;
            const cW = containerRef.current.clientWidth;
            setTextWidth(tW);
            setNeedsMarquee(tW > cW - 20);
        };
        check();
        const ro = new ResizeObserver(check);
        ro.observe(containerRef.current);
        return () => ro.disconnect();
    }, [text]);

    const duration = Math.max(4, textWidth / 60); // ~60 px/s

    return (
        <div
            ref={containerRef}
            className="overflow-hidden rounded-full border-[1.2px] px-3 py-1 relative"
            style={{borderColor: primaryColor, backgroundColor: primaryColor + '33'}}
        >
            {/* Hidden measuring span */}
            <span
                ref={measureRef}
                className="absolute invisible whitespace-nowrap text-xs pointer-events-none"
                aria-hidden="true"
                style={{fontFamily: 'var(--font-codec)'}}
            >
                {text}
            </span>

            {needsMarquee ? (
                <motion.div
                    className="flex whitespace-nowrap"
                    animate={{x: ['0%', '-50%']}}
                    transition={{repeat: Infinity, duration, ease: 'linear'}}
                >
                    <span className="text-white text-xs pr-12" style={{fontFamily: 'var(--font-codec)'}}>
                        {text}
                    </span>
                    <span className="text-white text-xs pr-12" style={{fontFamily: 'var(--font-codec)'}}>
                        {text}
                    </span>
                </motion.div>
            ) : (
                <span className="text-white text-xs whitespace-nowrap" style={{fontFamily: 'var(--font-codec)'}}>
                    {text}
                </span>
            )}
        </div>
    );
};


let initialPageLoadDone = false;

const ExperienceCard: React.FC<ExperienceCardProps> = ({
                                                           item,
                                                           index,
                                                           onSkillClick,
                                                           dimmed,
                                                           onHover,
                                                           currentSkillFilter,
                                                           skillIcons = [],
                                                       }) => {
    const hasFlag = (f: string) => item.title.includes(` -${f}`);
    const isVertical = hasFlag('v');
    const isSpecial = hasFlag('s');
    const isFull = hasFlag('f');
    const cleanTitle = item.title.replace(/ -[vsf]/g, '').trim();

    const primaryColor = item.color_primary ?? '#ffffff';
    const glowColor = hexToRgba(primaryColor, 0.5);

    const [isTouch, setIsTouch] = useState(false);
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const mq = window.matchMedia('(hover: none) and (pointer: coarse)');
        setIsTouch(mq.matches);
        const handler = (e: MediaQueryListEvent) => setIsTouch(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    const [hovered, setHovered] = useState(false);
    const [isStarHovered, setIsStarHovered] = useState(false);
    const [imageHovered, setImageHovered] = useState(false);
    const [viewerOpen, setViewerOpen] = useState(false);

    const images = useMemo(() => {
        if (!item.image_url) return [];
        return item.image_url
            .split(',')
            .map(u => u.replace(/\s|\n/g, ''))
            .filter(Boolean);
    }, [item.image_url]);

    const [isReadyToLoad, setIsReadyToLoad] = useState(initialPageLoadDone);
    useEffect(() => {
        if (initialPageLoadDone) return;
        const t = setTimeout(() => {
            initialPageLoadDone = true;
            setIsReadyToLoad(true);
        }, 1000 + index * 120);
        return () => clearTimeout(t);
    }, [index]);

    const [retrySuffixes, setRetrySuffixes] = useState<Record<string, number>>({});
    const retryTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

    const handleImgError = (src: string) => {
        if (retryTimers.current[src]) return;
        retryTimers.current[src] = setTimeout(() => {
            delete retryTimers.current[src];
            setRetrySuffixes(prev => ({...prev, [src]: Date.now()}));
        }, 2000);
    };

    useEffect(() => {
        const timers = retryTimers.current;
        return () => {
            Object.values(timers).forEach(clearTimeout);
        };
    }, []);

    const resolvedSrc = (src: string) => {
        const suffix = retrySuffixes[src];
        return suffix ? `${src}?_r=${suffix}` : src;
    };

    useEffect(() => {
        if (!isReadyToLoad || typeof window === 'undefined') return;
        images.forEach(src => {
            const img = new window.Image();
            img.src = src;
        });
    }, [isReadyToLoad, images]);

    const [imgIndex, setImgIndex] = useState(0);
    const [prevImgIndex, setPrevImgIndex] = useState(0);
    const [imgLoaded, setImgLoaded] = useState(false);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const imgIndexRef = useRef(imgIndex);
    imgIndexRef.current = imgIndex;
    const decodedRef = useRef<Set<string>>(new Set());
    const imageActive = isTouch || hovered;

    const ensureDecoded = async (src: string) => {
        if (decodedRef.current.has(src)) return;
        await new Promise<void>((resolve) => {
            const img = new Image();
            img.src = src;
            if ('decode' in img) {
                // @ts-ignore
                img.decode().then(resolve).catch(resolve);
            } else {
                // @ts-ignore
                img.onload = () => resolve();
                // @ts-ignore
                img.onerror = () => resolve();
            }
        });
        decodedRef.current.add(src);
    };

    useEffect(() => {
        if (images.length <= 1) return;
        let unmounted = false;
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);

        const nextImage = async () => {
            const next = (imgIndexRef.current + 1) % images.length;
            await ensureDecoded(images[next]!);
            setPrevImgIndex(imgIndexRef.current);
            setImgIndex(next);
            setImgLoaded(false);
        };

        const resetToFirst = async () => {
            await ensureDecoded(images[0]!);
            setPrevImgIndex(imgIndexRef.current);
            setImgIndex(0);
            setImgLoaded(false);
        };

        if (imageActive) {
            if (isTouch) {
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
                intervalRef.current = setInterval(() => {
                    if (unmounted) return;
                    nextImage();
                }, 2000);
            }
        } else {
            if (imgIndexRef.current !== 0) {
                resetTimeoutRef.current = setTimeout(() => {
                    if (unmounted) return;
                    resetToFirst();
                }, 750);
            }
        }

        return () => {
            unmounted = true;
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [imageActive, images.length]);

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
            el.parentElement!.style.gridRowEnd = `span ${Math.ceil(height / 10)}`;
        };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const imageFilterStyle = isTouch
        ? 'grayscale(0%) brightness(1)'
        : hovered
            ? 'grayscale(0%) brightness(1)'
            : dimmed
                ? 'grayscale(90%) brightness(0.9)'
                : 'grayscale(50%) brightness(1.15)';

    const aspectClass = isVertical ? 'aspect-[9/12]' : 'aspect-video';

    const shimmerPlaceholder = (
        <AnimatePresence>
            {!hasLoadedOnce && (
                <motion.div
                    key="img-ph"
                    className="absolute inset-0 overflow-hidden pointer-events-none"
                    style={{zIndex: 1, background: 'rgba(255,255,255,0.045)', borderRadius: 'inherit'}}
                    exit={{opacity: 0}}
                    transition={{duration: 0.5, ease: 'easeOut'}}
                >
                    <div
                        className="absolute inset-0"
                        style={{
                            background: 'linear-gradient(105deg, transparent 25%, rgba(255,255,255,0.13) 50%, transparent 75%)',
                            animation: 'ph-sweep 2s linear infinite',
                        }}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );

    // Build info line text
    const dateRange = (() => {
        const start = formatDate(item.start_date);
        if (!start || start === 'Jan 0001') return '';
        const end = item.is_current ? 'Present' : formatDate(item.end_date);
        return end ? `${start} — ${end}` : start;
    })();
    const infoText = [item.company, item.location, dateRange].filter(Boolean).join('  ·  ');

    const hasButtons = !!(item.app_store_url || item.link || item.github_url || item.featured);

    // Buttons — used in both image overlay (top-right) and no-image header
    const buttons = (
        <div
            className="flex items-center gap-2 shrink-0"
            onClick={e => e.stopPropagation()}
        >
            {item.app_store_url && (
                <motion.a
                    href={item.app_store_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{scale: 1.12}}
                    whileTap={{scale: 0.93}}
                    className="p-2 rounded-lg bg-zinc-600/20 text-gray-400 border border-transparent hover:border-gray-500 hover:text-white hover:bg-zinc-500/30 transition-colors"
                >
                    <AppStoreIcon/>
                </motion.a>
            )}
            {item.link && (
                <motion.a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{scale: 1.12}}
                    whileTap={{scale: 0.93}}
                    className="p-2 rounded-lg bg-zinc-600/20 text-gray-400 border border-transparent hover:border-gray-500 hover:text-white hover:bg-zinc-500/30 transition-colors"
                >
                    <ExternalLink className="w-4 h-4"/>
                </motion.a>
            )}
            {item.github_url && (
                <motion.a
                    href={item.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{scale: 1.12}}
                    whileTap={{scale: 0.93}}
                    className="p-2 rounded-lg bg-zinc-600/20 text-gray-400 border border-transparent hover:border-gray-500 hover:text-white hover:bg-zinc-500/30 transition-colors"
                >
                    <Github className="w-4 h-4"/>
                </motion.a>
            )}
            {item.featured && (
                <div className="relative">
                    <motion.button
                        type="button"
                        whileHover={{scale: 1.12}}
                        whileTap={{scale: 0.93}}
                        className="p-2 rounded-lg bg-zinc-600/20 text-yellow-400 transition-colors flex items-center justify-center border border-transparent hover:border-gray-500 hover:bg-zinc-500/30"
                        onMouseEnter={() => setIsStarHovered(true)}
                        onMouseLeave={() => setIsStarHovered(false)}
                    >
                        <StarIcon/>
                        <AnimatePresence>
                            {isStarHovered && (
                                <motion.div
                                    key="star-tip"
                                    className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-black text-white text-xs px-2 py-1 rounded-md pointer-events-none whitespace-nowrap z-10 text-center"
                                    initial={{opacity: 0, x: 4}}
                                    animate={{opacity: 1, x: 0}}
                                    exit={{opacity: 0, x: 4}}
                                    transition={{duration: 0.18, ease: 'easeOut'}}
                                >
                                    Featured<br/>Experience
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.button>
                </div>
            )}
        </div>
    );

    return (
        <motion.div
            className="block w-full relative group"
            transition={{duration: 0.25, ease: 'easeOut', type: 'spring', damping: 9, stiffness: 180}}
            onMouseEnter={() => {
                setHovered(true);
                onHover(item.id);
            }}
            onMouseLeave={() => {
                setHovered(false);
                onHover(null);
            }}
            whileHover={{
                translateY: -6,
                boxShadow: `0 0 40px 5px ${glowColor}`,
                borderRadius: '2rem',
            }}
        >
            <div
                ref={cardRef}
                className={`
                    relative overflow-hidden rounded-3xl
                    outline-1 outline-gray-400 shadow-2xl
                    bg-zinc-950
                    transition-all duration-300
                    ${isSpecial ? 'outline-dashed outline-4' : ''}
                    hover:outline-4 hover:outline-gray-50 hover:shadow-lg hover:shadow-red-500/10
                    ${dimmed ? 'opacity-93 outline-gray-700' : ''}
                `}
            >
                {/* Subtle top shimmer */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/5 to-transparent pointer-events-none z-0"/>

                {/* ── IMAGE SECTION — flush to card edges, corners clipped by card's overflow-hidden ── */}
                {images.length > 0 ? (
                    <div
                        className={`relative ${isFull ? '' : aspectClass} overflow-hidden cursor-pointer select-none`}
                        onMouseEnter={() => setImageHovered(true)}
                        onMouseLeave={() => setImageHovered(false)}
                        onClick={() => {
                            setViewerOpen(true);
                            setImageHovered(false);
                            setHovered(false);
                        }}
                    >
                        {shimmerPlaceholder}

                        {/* Images */}
                        {isFull ? (
                            <motion.img
                                src={isReadyToLoad ? resolvedSrc(images[0]!) : undefined}
                                alt={cleanTitle}
                                draggable={false}
                                className="w-full h-auto block"
                                animate={{filter: imageFilterStyle}}
                                transition={{filter: {duration: 0.25, ease: 'easeInOut'}}}
                                onLoad={() => {
                                    setImgLoaded(true);
                                    setHasLoadedOnce(true);
                                }}
                                onError={() => handleImgError(images[0]!)}
                            />
                        ) : (
                            images.map((src, idx) => {
                                const isPrev = idx === prevImgIndex;
                                const isCurrent = idx === imgIndex;
                                if (!isPrev && !isCurrent) return null;
                                const rSrc = resolvedSrc(src);
                                return (
                                    <motion.img
                                        key={`${idx}-${isPrev ? 'prev' : 'curr'}-${retrySuffixes[src] ?? 0}`}
                                        src={isReadyToLoad ? rSrc : undefined}
                                        alt={cleanTitle}
                                        draggable={false}
                                        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                                        style={{zIndex: isCurrent ? 20 : 10}}
                                        initial={{opacity: isCurrent ? 0 : 1}}
                                        animate={{
                                            opacity: isCurrent && imgLoaded ? 1 : 0,
                                            filter: imageFilterStyle,
                                        }}
                                        transition={{
                                            opacity: {duration: 0.4, ease: 'easeInOut'},
                                            filter: {duration: 0.25, ease: 'easeInOut'},
                                        }}
                                        onLoad={() => {
                                            decodedRef.current.add(src);
                                            if (isCurrent) {
                                                setImgLoaded(true);
                                                setHasLoadedOnce(true);
                                            }
                                        }}
                                        onError={() => handleImgError(src)}
                                    />
                                );
                            })
                        )}

                        {/* Fixed-height title gradient — same absolute height regardless of image size */}
                        <div
                            className="absolute bottom-0 left-0 right-0 pointer-events-none"
                            style={{
                                height: '7rem',
                                zIndex: 25,
                                background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 100%)',
                            }}
                        />

                        {/* Title at image bottom, over gradient */}
                        <div
                            className="absolute bottom-0 left-0 right-0 px-5 pb-3 pointer-events-none"
                            style={{zIndex: 26}}
                        >
                            <h3
                                className="text-2xl sm:text-3xl text-gray-200 group-hover:text-white transition-colors leading-tight"
                                style={{fontFamily: 'var(--font-codecBold)'}}
                            >
                                {cleanTitle}
                            </h3>
                        </div>

                        {/* Fullscreen hover overlay — backdrop-blur always present, only opacity animates */}
                        <motion.div
                            className="absolute inset-0 flex items-center justify-center bg-black/27 pointer-events-none backdrop-blur-md transform-gpu"
                            style={{zIndex: 28}}
                            animate={{opacity: imageHovered ? 1 : 0}}
                            transition={{duration: 0.3, ease: 'easeOut'}}
                        >
                            <motion.span
                                className="text-white text-sm tracking-wide"
                                style={{fontFamily: 'var(--font-codecLight)'}}
                                animate={{opacity: imageHovered ? 1 : 0, y: imageHovered ? 0 : 6}}
                                transition={{duration: 0.3, ease: 'easeOut'}}
                            >
                                Click to open fullscreen
                            </motion.span>
                        </motion.div>

                        {/* Buttons — top-right corner, above everything, stop propagation so they don't open viewer */}
                        {hasButtons && (
                            <div className="absolute top-3 right-3 flex items-center" style={{zIndex: 40}}>
                                {buttons}
                            </div>
                        )}
                    </div>
                ) : (
                    /* ── NO IMAGE: title + buttons in padded header ── */
                    <div className="px-5 pt-5 pb-0 relative">
                        <div className="flex items-start justify-between gap-4">
                            <h3
                                className="text-3xl text-gray-200 group-hover:text-white transition-colors"
                                style={{fontFamily: 'var(--font-codecBold)'}}
                            >
                                {cleanTitle}
                            </h3>
                            {hasButtons && buttons}
                        </div>
                    </div>
                )}

                {/* ── INFO LINE — company · location · dates, styled like active skill badge ── */}
                {infoText && (
                    <div className="px-5 pt-3">
                        <InfoBadge text={infoText} primaryColor={primaryColor}/>
                    </div>
                )}

                {/* ── CONTENT — description + skills ── */}
                <div className="px-5 pb-5 pt-3">
                    {item.description && item.description.split('\n').map((para, i) => (
                        <p
                            key={i}
                            className="text-gray-400 text-sm mb-3 whitespace-pre-wrap"
                            style={{fontFamily: 'var(--font-codecLight)'}}
                        >
                            {para}
                        </p>
                    ))}

                    {item.skills && (
                        <div className="flex flex-wrap mt-4.5 gap-2">
                            {item.skills.map((skill, badgeIndex) => {
                                const iconUrl = skillIcons.find(
                                    s => s.skill_name?.toLowerCase() === skill.toLowerCase()
                                )?.icon_url;
                                const badgeProps: React.ComponentProps<typeof SkillBadge> = {
                                    skill,
                                    badgeIndex,
                                    cardIndex: index,
                                    size: 'sm',
                                    isActive: currentSkillFilter === skill,
                                    dimmed,
                                    hovered,
                                    primaryColor,
                                    onClick: () => onSkillClick(currentSkillFilter === skill ? null : skill),
                                };
                                if (iconUrl) badgeProps.iconUrl = iconUrl;
                                return <SkillBadge key={skill} {...badgeProps}/>;
                            })}
                        </div>
                    )}
                </div>
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
