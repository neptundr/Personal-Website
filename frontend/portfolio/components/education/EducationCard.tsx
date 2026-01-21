import React from 'react';
import {motion} from 'framer-motion';

interface Education {
    type: 'university' | 'school';
    institution: string;
    institution_url?: string;
    start_year: number | string;
    end_year?: number | string;
    degree?: string;
    description?: string;
    logo_url?: string;
}

interface EducationCardProps {
    education: Education;
    index: number;
}

const EducationCard: React.FC<EducationCardProps> = ({education, index}) => {
    return (
        <motion.div
            initial={{opacity: 0, y: 40}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true, margin: '-50px'}}
            transition={{duration: 0.6, delay: index * 0.15}}
            whileHover={{y: -6}}
            className="group relative"
        >
            {/* Card container with original background */}
            <div
                className="relative flex flex-col rounded-3xl bg-zinc-950/60 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden hover:border-white/20 transition-all duration-300">

                {/* Top Row: Logo + Title */}
                <div className="flex items-center p-6 gap-6">

                    {/* Fixed Square Logo */}
                    {education.logo_url && education.institution_url ? (
                        <a
                            href={education.institution_url}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <div
                                className="w-28 h-28 rounded-xl bg-white/90 flex items-center justify-center shrink-0"
                                style={{aspectRatio: '1 / 1'}}
                            >
                                <motion.img
                                    src={education.logo_url}
                                    alt={education.institution}
                                    className="w-24 h-24 mx-auto my-auto object-contain"
                                    whileHover={{scale: 1.05}}
                                />
                            </div>
                        </a>
                    ) : (
                        <div
                            className="flex-shrink-0 w-24 h-24 bg-white rounded-lg overflow-hidden"
                            style={{aspectRatio: '1 / 1'}}
                        >
                            <motion.img
                                src={education.logo_url}
                                alt={education.institution}
                                className="w-5/6 h-5/6 mx-auto my-auto object-contain"
                                whileHover={{scale: 1.05}}
                            />
                        </div>
                    )}

                    {/* Title + Dates + Degree */}
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            {education.institution_url ? (
                                <a
                                    href={education.institution_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-lg md:text-xl font-semibold text-white hover:text-red-400 transition-colors duration-300"
                                >
                                    {education.institution}
                                </a>
                            ) : (
                                <h3 className="text-lg md:text-xl font-semibold text-white">
                                    {education.institution}
                                </h3>
                            )}
              {/*              <span className="text-sm text-gray-500">*/}
              {/*  {education.start_year} — {education.end_year || 'Present'}*/}
              {/*</span>*/}
                        </div>

                        {education.degree && (
                            <p className="mt-1 text-gray-400 font-light text-sm">
                                {/*{education.degree}*/}
                                {education.start_year} — {education.end_year || 'Present'}
                            </p>
                        )}
                    </div>
                </div>

                {/* Separator Line (gray) */}
                <div className="border-t border-zinc-900 mx-6"/>

                {/* Description */}
                {education.description && (
                    <div className="p-6 pt-4">
                        <p className="text-gray-400 text-sm leading-relaxed">
                            {education.description}
                        </p>
                    </div>
                )}

                {/* Bottom Red Gradient Line */}
                <motion.div
                    className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-red-500 to-transparent"
                    initial={{width: 0}}
                    whileInView={{width: '60%'}}
                    viewport={{once: true}}
                    transition={{duration: 0.8, delay: index * 0.15 + 0.3}}
                />

                {/* Subtle top glow overlay (like original) */}
                <div
                    className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/5 to-transparent pointer-events-none"/>
            </div>
        </motion.div>
    );
};

export default EducationCard;