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
    onSkillClick: (skill: string) => void;
    dimmed: boolean;
    onHover: (id: number | null) => void;
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
                                                       }) => {
    const handleMouseEnter = () => onHover(item.id);
    const handleMouseLeave = () => onHover(null);

    return (
        <motion.div
            initial={{opacity: 0, y: 30}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true, margin: '-50px'}}
            transition={{duration: 0.5, delay: index * 0.1}}
            className="group"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            whileHover={{y: -6}}
        >
            {/* Base card */}
            <div
                className={`
          relative overflow-hidden rounded-3xl
          bg-zinc-950/60 backdrop-blur-xl
          border border-white/10 shadow-2xl
          p-6 h-full transition-all duration-300
          hover:border-white/20 hover:shadow-lg hover:shadow-red-500/10
          ${dimmed ? 'opacity-40' : ''}
        `}
            >
                {/* Inner subtle glow overlay */}
                <div
                    className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/5 to-transparent pointer-events-none"/>

                {/* ================= CONTENT ================= */}
                <div className="mb-4">
                    <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                            <h3 className="text-2xl font-light text-white mb-2 group-hover:text-red-400 transition-colors">
                                {item.title}
                                {item.featured && (
                                    <span className="ml-3 text-xs text-yellow-400 italic font-normal">
                    ★ Featured
                  </span>
                                )}
                            </h3>

                            <div className="flex flex-wrap items-center gap-3 text-sm">
                                {item.company && <span className="text-gray-300 font-medium">{item.company}</span>}
                                {item.location && <span className="text-gray-500">{item.location}</span>}
                                {(item.start_date || item.end_date || item.is_current) && (
                                    <span className="text-gray-500">
                    {formatDate(item.start_date)}
                                        {item.start_date && (item.end_date || item.is_current) && ' — '}
                                        {item.is_current ? (
                                            <span className="text-red-400 font-medium">Present</span>
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
                    <p className="text-gray-400 text-sm leading-relaxed mb-4">{item.description}</p>
                )}

                {/* Skills */}
                {item.skills && (
                    <div className="flex flex-wrap gap-2">
                        {item.skills.map((skill) => (
                            <span key={skill} onClick={() => onSkillClick(skill)}>
                <SkillBadge skill={skill} size="sm"/>
              </span>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default ExperienceCard;