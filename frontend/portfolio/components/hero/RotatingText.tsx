import React, {useState, useEffect} from 'react';
import {motion, AnimatePresence} from 'framer-motion';

interface RotatingTextProps {
    items?: string[]; // array of strings to rotate
    intervalMs?: number; // optional: rotation interval
    className?: string; // optional: additional classNames
    textClassName?: string; // optional: classNames for text itself
}

const RotatingText: React.FC<RotatingTextProps> = ({
                                                       items = [],
                                                       intervalMs = 3000,
                                                       className = '',
                                                       textClassName = 'text-red-400',
                                                   }) => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (items.length <= 1) return;

        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % items.length);
        }, intervalMs);

        return () => clearInterval(interval);
    }, [items.length, intervalMs]);

    if (!items || items.length === 0) return null;

    return (
        <div className={`relative inline-block ${className} min-w-[200px]`}>
            <AnimatePresence mode="wait">
                <motion.span
                    key={index}
                    initial={{opacity: 0, filter: 'blur(8px)', y: 20}}
                    animate={{opacity: 1, filter: 'blur(0px)', y: 0}}
                    exit={{opacity: 0, filter: 'blur(8px)', y: -20}}
                    transition={{duration: 0.5, ease: 'easeInOut'}}
                    className={`absolute left-0 top-0 whitespace-nowrap ${textClassName}`}
                >
                    {items[index]}
                </motion.span>
            </AnimatePresence>

            {/* Invisible placeholder to maintain layout */}
            <span className="invisible">{items[index]}</span>
        </div>
    );
};

export default RotatingText;