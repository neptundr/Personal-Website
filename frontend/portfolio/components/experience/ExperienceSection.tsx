import React, {useState} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {Tabs, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {X} from 'lucide-react';
import {useQuery} from '@tanstack/react-query';
import {api} from '@/api/client';
import ExperienceCard from "@/components/experience/ExperienceCard";
import {Button} from "@/components/ui/button";

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

interface ExperienceSectionProps {
    items: ExperienceItem[];
}

const ExperienceSection: React.FC<ExperienceSectionProps> = ({items}) => {
    const [filter, setFilter] = useState<'all' | 'work' | 'project' | 'achievement'>('all');
    const [skillFilter, setSkillFilter] = useState<string | null>(null);
    const [showCount, setShowCount] = useState(6);
    const [hoveredId, setHoveredId] = useState<number | null>(null);

    const {data: skillIcons = []} = useQuery({
        queryKey: ['skillIcons'],
        queryFn: () => api.entities.SkillIcon.list(),
        initialData: [],
    });

    const getSkillIcon = (skill: string) =>
        skillIcons.find(
            (s: { skill_name: string }) =>
                s.skill_name?.toLowerCase() === skill.toLowerCase()
        )?.icon_url;

    const filteredItems = items
        .filter(item => filter === 'all' || item.type === filter)
        .filter(item => !skillFilter || item.skills?.includes(skillFilter));

    const displayedItems = filteredItems.slice(0, showCount);
    const hasMore = filteredItems.length > showCount;

    if (!items.length) return null;

    return (
        <section className="relative py-32 px-6 md:px-12 lg:px-24 /*bg-black*/ overflow-hidden">
            {/* Header */}
            <motion.div
                initial={{opacity: 0, y: 20}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true}}
                transition={{duration: 0.6}}
                className="mb-12"
            >
                <span className="text-red-500/80 text-xs tracking-[0.4em] uppercase font-medium ">
                    Experience
                </span>
                <h2 className="mt-4 text-4xl md:text-5xl lg:text-6xl text-white tracking-tight"
                    style={{fontFamily: 'var(--font-codec)'}}>
                    What I’ve Built<span className=" text-gray-300" style={{fontFamily: 'var(--font-futura)'}}></span>
                </h2>
            </motion.div>

            {/* Filters */}
            <div className="mb-12 flex items-center gap-3 flex-wrap relative">
                {/* General filter tabs */}
                <Tabs value={filter} onValueChange={v => setFilter(v as any)}>
                    <TabsList className="backdrop-blur-md bg-zinc-900/50 border border-zinc-800/50">
                        {['all', 'work', 'project', 'achievement'].map(v => (
                            <TabsTrigger
                                key={v}
                                value={v}
                                className={`
                                    text-gray-400
                                    data-[state=active]:bg-red-500/10
                                    data-[state=active]:text-red-400
                                    transition-all duration-200 ease-in-out
                                    hover:bg-gray-500/20 hover:text-gray-300
                                `}
                            >
                                {v === 'all'
                                    ? 'All'
                                    : ((v ?? "")[0] ?? "").toUpperCase() + v.slice(1)}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>

                {/* Skill filter / tip */}
                <div className="relative h-[36px] flex-1 flex items-center">
                    <AnimatePresence mode="wait" initial={false}>
                        {skillFilter ? (
                            <motion.button
                                key={skillFilter} // **important:** changing skill changes key so AnimatePresence triggers exit+enter
                                onClick={() => setSkillFilter(null)}
                                className="absolute px-4 py-2 backdrop-blur-md rounded-full text-sm bg-white/15 text-white border border-white/20 flex items-center gap-2"
                                style={{fontFamily: 'var(--font-codec)'}}
                                initial={{opacity: 0, x: -20}}
                                animate={{opacity: 1, x: 0}}
                                exit={{opacity: 0, x: 20}}
                                transition={{duration: 0.25}}
                            >
                                {getSkillIcon(skillFilter) && (
                                    <img
                                        src={getSkillIcon(skillFilter)}
                                        alt={skillFilter}
                                        className="w-4 h-4"
                                    />
                                )}
                                {skillFilter}
                                <motion.div
                                    whileHover={{scale: 1.25}}
                                    transition={{type: 'spring', stiffness: 300}}
                                >
                                    <X className="w-3 h-3"/>
                                </motion.div>
                            </motion.button>
                        ) : (
                            <motion.div
                                key="skillTip"
                                className="absolute px-4 py-2 text-sm text-gray-400 text-center"
                                style={{fontFamily: 'var(--font-codecLight)'}}
                                initial={{opacity: 0, x: -20}}
                                animate={{opacity: 1, x: 0}}
                                exit={{opacity: 0, x: 20}}
                                transition={{duration: 0.25}}
                            >
                                Tip: click on a skill badge to apply a filter
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedItems.map((item, index) => (
                    <ExperienceCard
                        key={item.id}
                        item={item}
                        index={index}
                        onSkillClick={setSkillFilter}
                        onHover={setHoveredId}
                        dimmed={hoveredId !== null && hoveredId !== item.id}
                    />
                ))}
            </div>

            {/* Show more */}
            {hasMore && (
                <div className="flex justify-center mt-12">
                    <button
                        onClick={() => setShowCount(c => Math.min(c + 6, filteredItems.length))}
                        className="px-8 py-3 rounded-full bg-zinc-900/60 text-white/80 border border-zinc-800/50 hover:text-white"
                    >
                        Show More ({Math.min(6, filteredItems.length - showCount)} more)
                    </button>
                </div>
            )}

            {/* Ambient glow */}
            <div className="absolute top-1/3 right-0 w-96 h-96 bg-red-500/5 rounded-full blur-3xl pointer-events-none"/>
            <div
                className="absolute bottom-1/4 left-0 w-72 h-72 bg-red-500/4 rounded-full blur-3xl pointer-events-none"/>
        </section>
    );
};

export default ExperienceSection;