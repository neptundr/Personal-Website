import React from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, School } from 'lucide-react';

class EducationCard extends React.Component<{ education: any, index: any }> {
    render() {
        let {education, index} = this.props;
        const Icon = education.type === 'university' ? GraduationCap : School;

        return (
            <motion.div
                initial={{opacity: 0, y: 40}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true, margin: "-50px"}}
                transition={{duration: 0.6, delay: index * 0.15}}
                whileHover={{y: -8}}
                className="group"
            >
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-zinc-900/90 to-zinc-950/90
        border border-zinc-800/50 backdrop-blur-sm p-8 h-full hover:border-zinc-700/50 transition-all duration-300">

                    {/* Icon */}
                    <motion.div
                        whileHover={{rotate: 10, scale: 1.1}}
                        className="w-12 h-12 rounded-lg bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center mb-6"
                    >
                        <Icon className="w-6 h-6 text-gray-400"/>
                    </motion.div>

                    {/* Logo */}
                    {education.logo_url && (
                        <motion.img
                            src={education.logo_url}
                            alt={education.institution}
                            className="absolute top-6 right-6 w-16 h-16 object-contain opacity-20 group-hover:opacity-40 transition-opacity duration-300"
                            whileHover={{scale: 1.1}}
                        />
                    )}

                    {/* Content */}
                    <div className="relative">
          <span className="text-xs text-gray-500 tracking-wide">
            {education.start_year} — {education.end_year || 'Present'}
          </span>

                        {education.institution_url ? (
                            <a
                                href={education.institution_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-3 text-xl md:text-2xl font-light text-white hover:text-red-400 transition-colors duration-300 inline-block"
                            >
                                {education.institution}
                            </a>
                        ) : (
                            <h3 className="mt-3 text-xl md:text-2xl font-light text-white">
                                {education.institution}
                            </h3>
                        )}

                        <p className="mt-2 text-gray-400 font-light">
                            {education.degree}
                            {education.field && <span className="text-gray-500"> • {education.field}</span>}
                        </p>

                        {education.description && (
                            <p className="mt-4 text-gray-400 text-sm leading-relaxed">
                                {education.description}
                            </p>
                        )}
                    </div>

                    {/* Decorative line */}
                    <motion.div
                        className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-red-500 to-transparent"
                        initial={{width: 0}}
                        whileInView={{width: '60%'}}
                        viewport={{once: true}}
                        transition={{duration: 0.8, delay: index * 0.15 + 0.3}}
                    />

                    {/* Glow effect */}
                    <motion.div
                        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                        style={{
                            background: 'radial-gradient(400px circle at 50% 100%, rgba(220, 38, 38, 0.08), transparent 50%)'
                        }}
                    />
                </div>
            </motion.div>
        );
    }
}

export default EducationCard;