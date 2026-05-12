'use client';

import React, {useState, useRef, useEffect} from 'react';
import {motion} from 'framer-motion';
import EducationCard from './EducationCard';

interface EducationItem {
    id: number;
    order?: number;
    [key: string]: any;
}

const EducationSection: React.FC<{ education: any }> = ({education}) => {
    const [isTouch, setIsTouch] = useState(false);
    const [touchActiveId, setTouchActiveId] = useState<number | null>(null);

    const cardEls = useRef<Map<number, Element>>(new Map());

    const rawEducation = education;
    const educationList: EducationItem[] = Array.isArray(rawEducation) ? rawEducation : [];

    const sortedEducation = [...educationList].sort((a, b) => {
        const orderA = a.order ?? 999;
        const orderB = b.order ?? 999;
        return orderA - orderB;
    });

    // Detect touch-only device
    useEffect(() => {
        const mq = window.matchMedia('(hover: none) and (pointer: coarse)');
        setIsTouch(mq.matches);
        const handler = (e: MediaQueryListEvent) => setIsTouch(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    // IntersectionObserver — lights up the most-visible card on touch
    useEffect(() => {
        if (!isTouch) return;

        const ratios = new Map<number, number>();
        const thresholds = Array.from({length: 11}, (_, i) => i * 0.1);

        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    const id = Number((entry.target as HTMLElement).dataset.cardId);
                    ratios.set(id, entry.intersectionRatio);
                }
                let bestId: number | null = null;
                let bestRatio = 0.15;
                for (const [id, ratio] of ratios) {
                    if (ratio > bestRatio) {
                        bestRatio = ratio;
                        bestId = id;
                    }
                }
                setTouchActiveId(bestId);
            },
            {threshold: thresholds}
        );

        for (const el of cardEls.current.values()) {
            observer.observe(el);
        }

        return () => observer.disconnect();
    }, [isTouch, sortedEducation.length]);

    if (educationList.length === 0) return null;

    return (
        <section className="relative pt-1 pb-40 px-6 md:px-12 lg:px-24 /*bg-black*/">
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
                    className="mt-4 text-4xl md:text-5xl lg:text-6xl text-white tracking-tight"
                    style={{fontFamily: 'var(--font-codecBold)'}}
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
                    <div
                        key={edu.id}
                        data-card-id={edu.id}
                        ref={(el) => {
                            if (el) cardEls.current.set(edu.id, el);
                            else cardEls.current.delete(edu.id);
                        }}
                    >
                        <EducationCard
                            education={edu}
                            index={index}
                            scrollActive={isTouch && touchActiveId === edu.id}
                        />
                    </div>
                ))}
            </div>

            {/* Decorative */}
            <div
                className="absolute bottom-0 left-1/2 w-1300 h-46 bg-red-500/8 rounded-full blur-3xl pointer-events-none -translate-x-1/2"/>

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
};

export default EducationSection;
