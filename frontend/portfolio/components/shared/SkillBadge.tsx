'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';

/* ===================== TYPES ===================== */
type SkillIconType = {
  id: number;
  skill_name: string;
  icon_url?: string;
};

type SkillBadgeProps = {
  skill: string;
  index?: number;
  size?: 'sm' | 'md' | 'lg';
};

/* ===================== ICON MAP ===================== */
const skillIconsMap: Record<string, string> = {
  python: '🐍',
  javascript: '⚡',
  typescript: '💠',
  react: '⚛️',
  vue: '💚',
  angular: '🔺',
  node: '💚',
  nodejs: '💚',
  unity: '🎮',
  unreal: '🎯',
  'c++': '⚙️',
  'c#': '🔷',
  java: '☕',
  rust: '🦀',
  go: '🐹',
  swift: '🍎',
  kotlin: '🟣',
  flutter: '🦋',
  docker: '🐳',
  kubernetes: '☸️',
  aws: '☁️',
  gcp: '🌐',
  azure: '🔵',
  tensorflow: '🧠',
  pytorch: '🔥',
  'machine learning': '🤖',
  ml: '🤖',
  ai: '🤖',
  'deep learning': '🧬',
  'data science': '📊',
  sql: '🗄️',
  mongodb: '🍃',
  postgresql: '🐘',
  redis: '🔴',
  git: '📝',
  linux: '🐧',
  figma: '🎨',
  photoshop: '📷',
  blender: '🎬',
  arduino: '🔌',
  'raspberry pi': '🍓',
  embedded: '🔧',
  robotics: '🤖',
  opencv: '👁️',
  matlab: '📐',
  solidworks: '⚙️',
  autocad: '📏',
  electronics: '⚡',
  default: '✦',
};

/* ===================== UTILS ===================== */
const getDefaultIcon = (skill: string): string | undefined => {
  const lower = skill.toLowerCase();
  for (const [key, icon] of Object.entries(skillIconsMap)) {
    if (lower.includes(key)) return icon;
  }
  return skillIconsMap.default;
};

/* ===================== COMPONENT ===================== */
const SkillBadge: React.FC<SkillBadgeProps> = ({ skill, index = 0, size = 'sm' }) => {
  /* Fetch custom icons from backend */
  const { data: customIcons = [] } = useQuery<SkillIconType[]>({
    queryKey: ['skillIcons'],
    queryFn: () => api.entities.SkillIcon.list(),
    initialData: [],
  });

  /* Check if there’s a custom icon for this skill */
  const customIcon = customIcons.find(
    (s) => s.skill_name?.toLowerCase() === skill.toLowerCase()
  );

  /* Size classes */
  const sizeClasses: Record<string, string> = {
    sm: 'text-xs px-2.5 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  const iconSizeClasses: Record<string, string> = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  /* Final icon */
  const icon = customIcon?.icon_url ? (
    <img
      src={customIcon.icon_url}
      alt={skill}
      className={`${iconSizeClasses[size]} object-contain`}
    />
  ) : (
    <span className="text-[0.9em]">{getDefaultIcon(skill)}</span>
  );

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{
        scale: 1.05,
        backgroundColor: 'rgba(220, 38, 38, 0.15)',
        borderColor: 'rgba(220, 38, 38, 0.5)',
      }}
      className={`inline-flex items-center gap-1.5 ${sizeClasses[size]} rounded-full 
        border border-white/10 bg-white/5 text-white/70 font-light
        transition-all duration-300 cursor-pointer backdrop-blur-sm`}
    >
      {icon}
      <span className="tracking-wide">{skill}</span>
    </motion.span>
  );
};

export default SkillBadge;