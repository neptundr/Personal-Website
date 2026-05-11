'use client';

import React, {useState, useRef, useEffect, useMemo} from 'react';
import {motion, AnimatePresence, type MotionStyle} from 'framer-motion';
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

/* ── Info footer bar ──
   - Top border only
   - Rest:  skill-badge defaults (gray-400/45 border, white/8 bg)
   - Hover: primaryColor border + primaryColor/20 bg
   - CSS @keyframes marquee, 30px/s */
const InfoBar: React.FC<{ text: string; primaryColor: string; hovered: boolean }> = ({
    text,
    primaryColor,
    hovered,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const measureRef = useRef<HTMLSpanElement>(null);
    const [needsMarquee, setNeedsMarquee] = useState(false);
    const [duration, setDuration] = useState(8);
    const animId = useRef(`mq-${Math.random().toString(36).slice(2, 8)}`).current;

    useEffect(() => {
        if (!containerRef.current || !measureRef.current) return;
        const check = () => {
            if (!containerRef.current || !measureRef.current) return;
            const tW = measureRef.current.scrollWidth;
            const cW = containerRef.current.clientWidth;
            const overflows = tW > cW;
            setNeedsMarquee(overflows);
            if (overflows) setDuration(Math.max(6, tW / 30));
        };
        check();
        const ro = new ResizeObserver(check);
        ro.observe(containerRef.current);
        return () => ro.disconnect();
    }, [text]);

    const borderColor = hovered ? primaryColor : 'rgba(156,163,175,0.45)';
    const bgColor     = hovered ? primaryColor + '33' : 'rgba(255,255,255,0.08)';

    return (
        <div
            ref={containerRef}
            className="overflow-hidden flex items-center h-9 w-full relative transition-colors duration-300"
            style={{
                borderTop: `1px solid ${borderColor}`,
                backgroundColor: bgColor,
            }}
        >
            <span
                ref={measureRef}
                className="invisible whitespace-nowrap text-xs pointer-events-none absolute"
                aria-hidden="true"
                style={{fontFamily: 'var(--font-codec)'}}
            >
                {text}
            </span>

            {needsMarquee ? (
                <>
                    <style>{`
                        @keyframes ${animId} {
                            from { transform: translateX(0); }
                            to   { transform: translateX(-50%); }
                        }
                    `}</style>
                    <div
                        className="flex whitespace-nowrap shrink-0"
                        style={{animation: `${animId} ${duration}s linear infinite`}}
                    >
                        <span className="text-white/80 text-xs pr-16" style={{fontFamily: 'var(--font-codec)'}}>
                            {text}
                        </span>
                        <span className="text-white/80 text-xs pr-16" style={{fontFamily: 'var(--font-codec)'}}>
                            {text}
                        </span>
                    </div>
                </>
            ) : (
                <span className="text-white/80 text-xs w-full text-center" style={{fontFamily: 'var(--font-codec)'}}>
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
        return () => { Object.values(timers).forEach(clearTimeout); };
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
        return () => { document.body.style.overflow = ''; };
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

    const dateRange = (() => {
        const start = formatDate(item.start_date);
        if (!start || start === 'Jan 0001') return '';
        const end = item.is_current ? 'Present' : formatDate(item.end_date);
        return end ? `${start} — ${end}` : start;
    })();
    const infoText = [item.company, item.location, dateRange].filter(Boolean).join('  ·  ');

    const hasButtons = !!(item.app_store_url || item.link || item.github_url || item.featured);
    const hasDescription = !!(item.description && item.description.trim());
    const hasSkills = !!(item.skills && item.skills.length > 0);
    const hasContent = hasDescription || hasSkills;

    const btnClass = "p-2 rounded-full bg-black/40 backdrop-blur-sm text-gray-300 border border-white/20 hover:border-white/50 hover:text-white hover:bg-black/60 transition-colors";

    const buttons = (
        <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
            {item.app_store_url && (
                <motion.a href={item.app_store_url} target="_blank" rel="noopener noreferrer"
                    whileHover={{scale: 1.12}} whileTap={{scale: 0.93}} className={btnClass}>
                    <AppStoreIcon/>
                </motion.a>
            )}
            {item.link && (
                <motion.a href={item.link} target="_blank" rel="noopener noreferrer"
                    whileHover={{scale: 1.12}} whileTap={{scale: 0.93}} className={btnClass}>
                    <ExternalLink className="w-4 h-4"/>
                </motion.a>
            )}
            {item.github_url && (
                <motion.a href={item.github_url} target="_blank" rel="noopener noreferrer"
                    whileHover={{scale: 1.12}} whileTap={{scale: 0.93}} className={btnClass}>
                    <Github className="w-4 h-4"/>
                </motion.a>
            )}
            {item.featured && (
                <div className="relative">
                    <motion.button
                        type="button"
                        whileHover={{scale: 1.12}} whileTap={{scale: 0.93}}
                        className={`${btnClass} text-yellow-400 hover:text-yellow-300 flex items-center justify-center`}
                        onMouseEnter={() => setIsStarHovered(true)}
                        onMouseLeave={() => setIsStarHovered(false)}
                    >
                        <StarIcon/>
                        <AnimatePresence>
                            {isStarHovered && (
                                <motion.div
                                    key="star-tip"
                                    className="absolute right-full mr-1 top-1/2 -translate-y-1/2 bg-black text-white text-xs px-2 py-1 rounded-md pointer-events-none whitespace-nowrap z-10 text-center"
                                    initial={{opacity: 0, x: 15, scale: 0.5}} animate={{opacity: 1, x: 0, scale: 1}}
                                    exit={{opacity: 0, x: 6, scale: 0.9}} transition={{duration: 0.18, ease: 'easeOut'}}
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
            onMouseEnter={() => { setHovered(true); onHover(item.id); }}
            onMouseLeave={() => { setHovered(false); onHover(null); }}
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
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/5 to-transparent pointer-events-none z-0"/>

                {/* ── IMAGE SECTION ──
                    Outer div has NO overflow-hidden so it doesn't create its own stacking context.
                    Images are clipped by an inner absolute div instead.
                    This lets z-indices of title/overlay compete in card context, enabling the
                    seam-cover div (outside image section) to slot between gradient and title. */}
                {images.length > 0 ? (
                    <div
                        className={`relative ${isFull ? '' : aspectClass} cursor-pointer select-none`}
                        onMouseEnter={() => setImageHovered(true)}
                        onMouseLeave={() => setImageHovered(false)}
                        onClick={() => {
                            setViewerOpen(true);
                            setImageHovered(false);
                            setHovered(false);
                        }}
                    >
                        {/* Inner clip — images only */}
                        <div className="absolute inset-0 overflow-hidden">
                            {shimmerPlaceholder}
                            {isFull ? (
                                <motion.img
                                    src={isReadyToLoad ? resolvedSrc(images[0]!) : undefined}
                                    alt={cleanTitle}
                                    draggable={false}
                                    className="w-full h-auto block"
                                    animate={{filter: imageFilterStyle}}
                                    transition={{filter: {duration: 0.25, ease: 'easeInOut'}}}
                                    onLoad={() => { setImgLoaded(true); setHasLoadedOnce(true); }}
                                    onError={() => handleImgError(images[0]!)}
                                />
                            ) : (
                                images.map((src, idx) => {
                                    const isPrev = idx === prevImgIndex;
                                    const isCurrent = idx === imgIndex;
                                    if (!isPrev && !isCurrent) return null;
                                    return (
                                        <motion.img
                                            key={`${idx}-${isPrev ? 'prev' : 'curr'}-${retrySuffixes[src] ?? 0}`}
                                            src={isReadyToLoad ? resolvedSrc(src) : undefined}
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
                                                if (isCurrent) { setImgLoaded(true); setHasLoadedOnce(true); }
                                            }}
                                            onError={() => handleImgError(src)}
                                        />
                                    );
                                })
                            )}
                        </div>

                        {/* Gradient — title background, fades image to zinc-950 */}
                        <div
                            className="absolute bottom-0 left-0 right-0 pointer-events-none"
                            style={{
                                height: '8rem',
                                zIndex: 25,
                                background: 'linear-gradient(to top, rgb(15, 15, 17) 0%, rgb(15, 15, 17) 30%, transparent 100%)',
                            }}
                        />

                        {/* Title — fades OUT when imageHovered (mutually exclusive with fullscreen overlay) */}
                        <motion.div
                            className="absolute bottom-2 left-0 right-0 px-5 pb-2 pointer-events-none"
                            style={{zIndex: 30}}
                            animate={{opacity: imageHovered ? 0 : 1}}
                            transition={{duration: 0.25, ease: 'easeOut'}}
                        >
                            <h3
                                className="text-2xl sm:text-3xl text-gray-200 group-hover:text-white transition-colors leading-tight"
                                style={{fontFamily: 'var(--font-codecBold)'}}
                            >
                                {cleanTitle}
                            </h3>
                        </motion.div>

                        {/* Fullscreen overlay — fades IN when imageHovered, z-31 above title */}
                        <motion.div
                            className="absolute inset-0 flex items-center justify-center bg-black/27 pointer-events-none backdrop-blur-md transform-gpu"
                            style={{
                                zIndex: 31,
                                WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 75%, transparent 100%)',
                                maskImage: 'linear-gradient(to bottom, black 0%, black 75%, transparent 100%)',
                            } as MotionStyle}
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

                        {/* Buttons */}
                        {hasButtons && (
                            <div className="absolute top-3 right-3 flex items-center" style={{zIndex: 40}}>
                                {buttons}
                            </div>
                        )}
                    </div>
                ) : (
                    /* ── NO IMAGE ── */
                    <div className="px-5 pt-5 pb-0 relative">
                        <div className="flex items-start justify-between gap-4">
                            <h3 className="text-3xl text-gray-200 group-hover:text-white transition-colors"
                                style={{fontFamily: 'var(--font-codecBold)'}}>
                                {cleanTitle}
                            </h3>
                            {hasButtons && buttons}
                        </div>
                    </div>
                )}

                {/* ── SEAM COVER ──
                    Lives outside the image container, overlaps its bottom by 2rem via negative margin.
                    backdrop-blur + gradient from transparent → zinc-950 guarantees zero visible seam
                    at the image/content boundary, including when the fullscreen blur overlay is active.
                    z-29: above image gradient (z-25) but below title (z-30) and fullscreen overlay (z-31). */}
                {images.length > 0 && (
                    <div
                        className="relative pointer-events-none"
                        style={{
                            zIndex: 20,
                            marginTop: '-2rem',
                            height: '2rem',
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)',
                            background: 'linear-gradient(to bottom, transparent 40%, rgb(15, 15, 17) 70%)',
                        }}
                    />
                )}

                {/* ── CONTENT — description + skills ──
                    -mt-4 slides description up slightly onto the image area (which is already
                    zinc-950 from the gradient, so color is seamless). Equal 12px gaps throughout. */}
                {hasContent && (
                    <div className={`relative px-4 ${hasDescription ? (images.length > 0 ? "pt-2": "mt-2 -pt-2") : "-pt-3"} ${infoText ? 'pb-4' : (hasSkills ? 'pb-5': "pb-1")} -mt-4`}
                         style={{zIndex: 32}}>
                        {hasDescription && item.description!.split('\n').map((para, i) => (
                            <p key={i} className={`${images.length > 0 ? "pl-8" : "pl-1"} pr-5 text-gray-400 text-sm mb-3 whitespace-pre-wrap`}
                               style={{fontFamily: 'var(--font-codecLight)'}}>
                                {para}
                            </p>
                        ))}

                        {hasSkills && (
                            <div className={`flex flex-wrap gap-x-1.5 gap-y-2 ${hasDescription ? 'mt-3' : 'mt-7'}`}>
                                {item.skills!.map((skill, badgeIndex) => {
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
                )}

                {/* ── INFO BAR — very bottom, full width ── */}
                {infoText && (
                    <InfoBar text={infoText} primaryColor={primaryColor} hovered={hovered}/>
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
