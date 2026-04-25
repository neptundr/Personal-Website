'use client';

import React, {useState, useEffect, useRef} from 'react';
import {motion} from 'framer-motion';

type SkillBadgeProps = {
    skill: string;
    /** Optional custom icon URL sourced from parent (Supabase skill_icons). */
    iconUrl?: string;
    badgeIndex?: number;
    cardIndex?: number;
    size?: 'sm' | 'md' | 'lg';
    isActive?: boolean;
    dimmed?: boolean;
    hovered?: boolean;
    onClick?: () => void;
};

const skillIconsMap: Record<string, string> = {
    python: '🐍', javascript: '⚡', typescript: '💠', react: '⚛️',
    vue: '💚', angular: '🔺', node: '💚', nodejs: '💚', unity: '🎮',
    unreal: '🎯', 'c++': '⚙️', 'c#': '🔷', java: '☕', rust: '🦀',
    go: '🐹', swift: '🍎', kotlin: '🟣', flutter: '🦋', docker: '🐳',
    kubernetes: '☸️', aws: '☁️', gcp: '🌐', azure: '🔵', tensorflow: '🧠',
    pytorch: '🔥', 'machine learning': '🤖', ml: '🤖', ai: '🤖',
    'deep learning': '🧬', 'data science': '📊', sql: '🗄️', mongodb: '🍃',
    postgresql: '🐘', redis: '🔴', git: '📝', linux: '🐧', figma: '🎨',
    photoshop: '📷', blender: '🎬', arduino: '🔌', 'raspberry pi': '🍓',
    embedded: '🔧', robotics: '🤖', opencv: '👁️', matlab: '📐',
    solidworks: '⚙️', autocad: '📏', electronics: '⚡', default: '✦',
};

const getDefaultIcon = (skill: string) => {
    const lower = skill.toLowerCase();
    for (const [key, icon] of Object.entries(skillIconsMap)) {
        if (lower.includes(key)) return icon;
    }
    return skillIconsMap.default;
};

let initialBadgeLoadDone = false;

const SkillBadge: React.FC<SkillBadgeProps> = ({
                                                   skill,
                                                   iconUrl,
                                                   badgeIndex = 0,
                                                   cardIndex = 0,
                                                   size = 'sm',
                                                   isActive = false,
                                                   dimmed = false,
                                                   hovered = false,
                                                   onClick
                                               }) => {
    const [imgLoaded, setImgLoaded] = useState(false);
    const [showCircleShimmer, setShowCircleShimmer] = useState(true);
    const [popScale, setPopScale] = useState(1);

    // Delay src on first page load only. Once fired, the flag stays true
    // so re-mounts (filter toggles) skip the wait.
    const [isReadyToLoad, setIsReadyToLoad] = useState(initialBadgeLoadDone);
    useEffect(() => {
        if (initialBadgeLoadDone) return;
        const t = setTimeout(() => {
            initialBadgeLoadDone = true;
            setIsReadyToLoad(true);
        }, 1200 + cardIndex * 80 + badgeIndex * 30);
        return () => clearTimeout(t);
    }, [cardIndex, badgeIndex]);

    // Retry failed icon loads every 2 s (cache-bust via timestamp).
    const [retrySuffix, setRetrySuffix] = useState(0);
    const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleImgError = () => {
        if (retryTimer.current) return;
        retryTimer.current = setTimeout(() => {
            retryTimer.current = null;
            setRetrySuffix(Date.now());
            setImgLoaded(false);
        }, 2000);
    };

    useEffect(() => () => { if (retryTimer.current) clearTimeout(retryTimer.current); }, []);

    const resolvedIconSrc = iconUrl
        ? (retrySuffix ? `${iconUrl}?_r=${retrySuffix}` : iconUrl)
        : undefined;

    // Remove shimmer from DOM after the fade so the animation stops.
    useEffect(() => {
        if (!imgLoaded) return;
        const t = setTimeout(() => setShowCircleShimmer(false), 400);
        return () => clearTimeout(t);
    }, [imgLoaded]);

    useEffect(() => {
        setImgLoaded(false);
        setShowCircleShimmer(true);
        setRetrySuffix(0);
    }, [iconUrl]);

    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout>;

        const pop = () => {
            setPopScale(1.07);
            setTimeout(() => setPopScale(1), 200);

            timeout = setTimeout(pop, 10000); // fixed interval forever
        };

        timeout = setTimeout(pop, cardIndex * 1500 + Math.pow(badgeIndex, 0.6) * 150);

        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const iconSizeClass = size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';

    const icon = resolvedIconSrc
        ? (
            <span className={`relative inline-flex shrink-0 ${iconSizeClass}`}>
                {/* Circle shimmer — real element so it's reliably clipped/animated.
                    Fades via CSS transition then unmounts to stop the animation. */}
                {showCircleShimmer && (
                    <span
                        className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"
                        style={{
                            background: 'rgba(255,255,255,0.09)',
                            opacity: imgLoaded ? 0 : 1,
                            transition: 'opacity 0.35s ease',
                        }}
                    >
                        <span
                            className="absolute inset-0"
                            style={{
                                background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.18) 50%, transparent 80%)',
                                animation: 'ph-sweep 2s linear infinite',
                            }}
                        />
                    </span>
                )}
                <motion.img
                    key={retrySuffix}
                    src={isReadyToLoad ? resolvedIconSrc : undefined}
                    alt={skill}
                    onLoad={() => setImgLoaded(true)}
                    onError={handleImgError}
                    initial={{scale: 0.6, opacity: 0}}
                    animate={imgLoaded ? {scale: 1, opacity: 1} : {}}
                    transition={{type: 'spring', stiffness: 260, damping: 20, delay: 0.15 + 0.125 * badgeIndex}}
                    className={`${iconSizeClass} object-contain`}
                />
            </span>
        )
        : <span className="text-[0.9em]">{getDefaultIcon(skill)}</span>;

    const sizeClasses: Record<string, string> = {
        sm: 'text-xs px-2.5 py-1',
        md: 'text-sm px-3 py-1.5',
        lg: 'text-base px-4 py-2',
    };

    return (
        <motion.span
            whileHover={{scale: 1.08}}
            animate={{scale: dimmed ? 1 : popScale}}
            transition={{duration: 0.05, ease: "easeInOut", type: 'spring'}}
            onClick={onClick}
            className={`
                inline-flex items-center gap-1.5 ${sizeClasses[size]} rounded-full border
                ${isActive
                ? 'border-red-500 bg-red-500/20 text-white'
                : `border-[color-mix(in_oklab,var(--ink)_30%,transparent)] bg-[color-mix(in_oklab,var(--ink)_8%,transparent)] text-[var(--ink-soft)]`}
                font-light transition-all duration-300 cursor-pointer
                hover:border-red-500 hover:bg-red-500/55 hover:text-white
            `}
        >
            {icon}
            <motion.span className="tracking-wide" style={{fontFamily: 'var(--font-codec)'}}>
                {skill}
            </motion.span>
        </motion.span>
    );
};

export default SkillBadge;
