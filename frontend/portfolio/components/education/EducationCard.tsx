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
            <div
                className="relative flex overflow-hidden border shadow-2xl
                backdrop-blur-2xl rounded-3xl h-full
                transition-[border,box-shadow,opacity] duration-300 border-gray-400
                hover:border-gray-50 hover:shadow-lg hover:shadow-red-500/10 hover:border-2"
            >
                {/* LEFT COLUMN */}
                <div className="p-3 sm:p-3 md:p-3 flex flex-col items-start">
                    {education.logo_url && (
                        <a
                            href={education.institution_url}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <div
                                className="
                                    w-25 h-25
                                    sm:w-24 sm:h-24
                                    md:w-28 md:h-28
                                    lg:w-40 lg:h-40
                                    rounded-xl bg-white/90
                                    flex items-center justify-center shrink-0
                                "
                                style={{aspectRatio: '1 / 1'}}
                            >
                                <motion.img
                                    src={education.logo_url}
                                    alt={education.institution}
                                    className="
                                        w-20 h-20
                                        {/*sm:w-24 sm:h-24
                                        md:w-24 md:h-24
                                        lg:w-30 lg:h-30*/}
                                        object-contain
                                    "
                                    whileHover={{opacity: 0.75, scale: 1.05}}
                                />
                            </div>
                        </a>
                    )}
                </div>

                {/* RIGHT COLUMN */}
                <div className="flex flex-col flex-1 pl-2 pt-4 sm:pt-3 md:pt-4.5 ">
                    <a
                        href={education.institution_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="
                            flex flex-wrap items-baseline
                            text-lg md:text-3xl font-semibold text-white
                            hover:text-zinc-300 transition-colors duration-300
                        "
                        style={{fontFamily: 'var(--font-codec)'}}
                    >
                        <span className="whitespace-nowrap pr-4 ">
                            {education.institution} {" "}
                        </span>

                        <span className="text-gray-400 whitespace-nowrap pr-5">
                            {education.start_year} — {education.end_year || 'Present'}
                        </span>
                    </a>

                    <div className="border-t border-zinc-700/90 my-3"/>

                    {education.description && (
                        <p className="text-gray-400 text-sm leading-relaxed pb-3 pr-5">
                            {education.description}
                        </p>
                    )}
                </div>

                {/* Subtle glow */}
                <div
                    className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/5 to-transparent pointer-events-none"/>
            </div>
        </motion.div>
    );
};

export default EducationCard;