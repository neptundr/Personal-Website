'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';

type SkillIconType = {
    id: number;
    skill_name: string;
    icon_url?: string;
};

type SkillBadgeProps = {
    skill: string;
    index?: number;
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

const SkillBadge: React.FC<SkillBadgeProps> = ({ skill, index = 0, size = 'sm', isActive = false, dimmed = false, hovered = false, onClick }) => {
    const { data: customIcons = [] } = useQuery<SkillIconType[]>({
        queryKey: ['skillIcons'],
        queryFn: () => api.entities.SkillIcon.list(),
        initialData: [],
    });

    const customIcon = customIcons.find(s => s.skill_name?.toLowerCase() === skill.toLowerCase());

    const [imgLoaded, setImgLoaded] = useState(false);
    const [popScale, setPopScale] = useState(1);

    useEffect(() => {
        setImgLoaded(false);
    }, [customIcon?.icon_url]);

    useEffect(() => {
        let timeout: NodeJS.Timeout;
        const triggerPop = () => {
            const randomTime = hovered ? (Math.random() * 7000 + 3000): (Math.random() * 15000 + 7000);
            timeout = setTimeout(() => {
                setPopScale(1.13);
                setTimeout(() => setPopScale(1), 200); // quick pop back to normal
                triggerPop();
            }, randomTime);
        };
        /*if (Math.random() * 10 > 7) */triggerPop();
        return () => clearTimeout(timeout);
    }, []);

    const icon = customIcon?.icon_url
        ? (
            <motion.img
                src={customIcon.icon_url}
                alt={skill}
                onLoad={() => setImgLoaded(true)}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={imgLoaded ? { scale: 1, opacity: 1 } : {}}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.15 + 0.125 * index }}
                className={`${size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'} object-contain`}
            />
        )
        : <span className="text-[0.9em]">{getDefaultIcon(skill)}</span>;

    const sizeClasses: Record<string, string> = {
        sm: 'text-xs px-2.5 py-1',
        md: 'text-sm px-3 py-1.5',
        lg: 'text-base px-4 py-2',
    };

    return (
        <motion.span
            whileHover={{ scale: 1.08 }}
            animate={{ scale: dimmed ? 1 : popScale }}
            transition={{ duration: 0.1 }}
            onClick={onClick}
            className={`
                inline-flex items-center gap-1.5 ${sizeClasses[size]} rounded-full border
                ${isActive
                    ? 'border-red-500 bg-red-500/20 text-white'
                    : `border-gray-400/45 bg-white/8 text-gray-200`}
                font-light transition-all duration-300 cursor-pointer 
                hover:border-red-500 hover:bg-red-500/55 hover:text-white
            `}
        >
            {icon}
            <motion.span className="tracking-wide" style={{ fontFamily: 'var(--font-codec)' }}>
                {skill}
            </motion.span>
        </motion.span>
    );
};

export default SkillBadge;