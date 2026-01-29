import React from 'react';
import {motion} from 'framer-motion';
import EducationCard from './EducationCard';

class EducationSection extends React.Component<{ education: any }> {
    render() {
        let {education} = this.props;
        if (!education || education.length === 0) return null;

        const sortedEducation = [...education].sort((a, b) => {
            const orderA = a.order ?? 999;
            const orderB = b.order ?? 999;
            return orderA - orderB;
        });

        return (
            <section className="relative pt-32 pb-40 px-6 md:px-12 lg:px-24 /*bg-black*/">
                {/* Section header */}
                <motion.div
                    initial={{opacity: 0, y: 20}}
                    whileInView={{opacity: 1, y: 0}}
                    viewport={{once: true}}
                    transition={{duration: 0.6}}
                    className="mb-16"
                >
                    <motion.span
                        className="text-red-500/80 text-xs tracking-[0.4em] uppercase font-medium"
                        initial={{opacity: 0, x: -20}}
                        whileInView={{opacity: 1, x: 0}}
                        viewport={{once: true}}
                        transition={{duration: 0.6, delay: 0.1}}
                    >
                        Background
                    </motion.span>
                    <motion.h2
                        className="mt-4 text-4xl md:text-5xl lg:text-6xl text-white tracking-tight" style={{fontFamily: 'var(--font-codec)'}}
                        initial={{opacity: 0, y: 20}}
                        whileInView={{opacity: 1, y: 0}}
                        viewport={{once: true}}
                        transition={{duration: 0.6, delay: 0.2}}
                    >
                        Education
                    </motion.h2>
                </motion.div>

                {/* Education cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
                    {sortedEducation.map((edu, index) => (
                        <EducationCard key={edu.id} education={edu} index={index}/>
                    ))}
                </div>

                {/* Decorative */}
                <div
                    className="absolute bottom-0 left-1/2 w-96 h-96 bg-red-500/5 rounded-full blur-3xl pointer-events-none -translate-x-1/2"/>


                <div
                    className="
                        pointer-events-none
                        absolute bottom-0 left-0
                        w-full h-30
                        bg-gradient-to-b
                        from-transparent
                        to-black
                        z-9
                    "
                />
            </section>
        );
    }
}

export default EducationSection;