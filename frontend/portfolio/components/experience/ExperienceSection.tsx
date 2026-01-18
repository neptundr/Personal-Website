import React, {useState} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {format} from 'date-fns';
import {ExternalLink, Github, X} from 'lucide-react';
import {Tabs, TabsList, TabsTrigger} from '@/components/ui/tabs';
import SkillBadge from '../shared/SkillBadge';
import {useQuery} from '@tanstack/react-query';
import {api} from '@/api/client';

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
}

const ExperienceCard: React.FC<ExperienceCardProps> = ({item, index, onSkillClick}) => {
    const formatDate = (dateStr?: string | number | Date) => {
        if (!dateStr) return '';
        try {
            return format(new Date(dateStr), 'MMM yyyy');
        } catch {
            return dateStr?.toString() || '';
        }
    };

    return (
        <motion.div
            initial={{opacity: 0, y: 30}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true, margin: '-50px'}}
            transition={{duration: 0.5, delay: index * 0.1}}
            whileHover={{y: -4}}
            className="group"
        >
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-zinc-900/90 to-zinc-950/90
        border border-zinc-800/50 backdrop-blur-sm p-6 h-full transition-all duration-300
        hover:border-zinc-700/50 hover:shadow-lg hover:shadow-red-500/5">

                {/* Header */}
                <div className="mb-4">
                    <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                            <h3 className="text-2xl font-light text-white mb-2 group-hover:text-red-400 transition-colors">
                                {item.title}
                                {item.featured && (
                                    <span className="ml-3 text-xs text-yellow-400 italic font-normal">★ Featured</span>
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
                {item.skills && item.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {item.skills.map((skill) => (
                            <span key={skill} onClick={() => onSkillClick(skill)}>
                <SkillBadge skill={skill} size="sm"/>
              </span>
                        ))}
                    </div>
                )}

                {/* Subtle glow on hover */}
                <motion.div
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                        background:
                            'radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(220, 38, 38, 0.03), transparent 40%)',
                    }}
                />
            </div>
        </motion.div>
    );
};

interface ExperienceSectionProps {
    items: ExperienceItem[];
}

const ExperienceSection: React.FC<ExperienceSectionProps> = ({items}) => {
    const [filter, setFilter] = useState<'all' | 'work' | 'project' | 'achievement'>('all');
    const handleFilterChange = (value: string) => {
        setFilter(value as 'all' | 'work' | 'project' | 'achievement');
    };

    const [skillFilter, setSkillFilter] = useState<string | null>(null);
    const [showCount, setShowCount] = useState(6);

    const {data: skillIcons = []} = useQuery({
        queryKey: ['skillIcons'],
        queryFn: () => api.entities.SkillIcon.list(),
        initialData: [],
    });

    const getSkillIcon = (skillName: string) =>
        skillIcons.find((s: { skill_name: string }) => s.skill_name?.toLowerCase() === skillName.toLowerCase())
            ?.icon_url;

    const filteredItems = items
        .filter((item) => filter === 'all' || item.type === filter)
        .filter((item) => !skillFilter || (item.skills && item.skills.includes(skillFilter)));

    const displayedItems = filteredItems.slice(0, showCount);
    const hasMore = filteredItems.length > showCount;

    if (!items || items.length === 0) return null;

    return (
        <section className="relative py-32 px-6 md:px-12 lg:px-24 bg-black">
            {/* Header */}
            <motion.div initial={{opacity: 0, y: 20}} whileInView={{opacity: 1, y: 0}} viewport={{once: true}}
                        transition={{duration: 0.6}} className="mb-12">
                <motion.span className="text-red-500/80 text-xs tracking-[0.4em] uppercase font-medium">
                    Experience
                </motion.span>
                <motion.h2 className="mt-4 text-4xl md:text-5xl lg:text-6xl font-light text-white tracking-tight">
                    What I've <span className="italic text-gray-300" style={{fontFamily: 'Georgia, serif'}}>Built</span>
                </motion.h2>
            </motion.div>

            {/* Filters */}
            <motion.div className="mb-12 flex items-center gap-3 flex-wrap">
                <Tabs value={filter} onValueChange={handleFilterChange} className="inline-block">
                    <TabsList className="bg-zinc-900/50 border border-zinc-800/50 backdrop-blur-sm">
                        <TabsTrigger value="all"
                                     className="data-[state=active]:bg-red-500/10 data-[state=active]:text-red-400 text-gray-400">All</TabsTrigger>
                        <TabsTrigger value="work"
                                     className="data-[state=active]:bg-red-500/10 data-[state=active]:text-red-400 text-gray-400">Work</TabsTrigger>
                        <TabsTrigger value="project"
                                     className="data-[state=active]:bg-red-500/10 data-[state=active]:text-red-400 text-gray-400">Projects</TabsTrigger>
                        <TabsTrigger value="achievement"
                                     className="data-[state=active]:bg-red-500/10 data-[state=active]:text-red-400 text-gray-400">Achievements</TabsTrigger>
                    </TabsList>
                </Tabs>

                {skillFilter && (
                    <motion.button onClick={() => setSkillFilter(null)}
                                   className="px-4 py-2 rounded-full text-sm font-light tracking-wide bg-white/10 text-white border border-white/20 hover:bg-white/15 transition-all duration-300 flex items-center gap-2">
                        {getSkillIcon(skillFilter) &&
                            <img src={getSkillIcon(skillFilter)} alt={skillFilter} className="w-4 h-4 object-contain"/>}
                        {skillFilter} <X className="w-3 h-3"/>
                    </motion.button>
                )}
            </motion.div>

            {/* Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedItems.map((item, index) => (
                    <ExperienceCard key={item.id} item={item} index={index} onSkillClick={setSkillFilter}/>
                ))}
            </div>

            {/* Show More */}
            {hasMore && (
                <motion.div className="flex justify-center mt-12">
                    <button onClick={() => setShowCount((prev) => Math.min(prev + 6, filteredItems.length))}
                            className="px-8 py-3 rounded-full bg-zinc-900/50 text-white/80 border border-zinc-800/50 hover:bg-zinc-800/50 hover:text-white transition-all duration-300 font-light tracking-wide">
                        Show More ({Math.min(6, filteredItems.length - showCount)} more)
                    </button>
                </motion.div>
            )}

            {filteredItems.length === 0 && (
                <div className="text-center py-16 text-gray-500">
                    <p className="italic">No items match your filters.</p>
                </div>
            )}

            {/* Decorative elements */}
            <div className="absolute top-1/4 right-0 w-96 h-96 bg-red-500/5 rounded-full blur-3xl pointer-events-none"/>
            <div
                className="absolute bottom-1/4 left-0 w-64 h-64 bg-red-500/3 rounded-full blur-3xl pointer-events-none"/>
        </section>
    );
};

export default ExperienceSection;