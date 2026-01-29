import React, {useState, useEffect} from 'react';
import {motion, AnimatePresence} from 'framer-motion';

interface RotatingTextProps {
    items?: string[];
    showLine?: boolean;
    delayMs?: number;
    intervalMs?: number;
    vertical?: boolean;
    altDir?: boolean;
    className?: string;
    textClassName?: string;
}

const RotatingText: React.FC<RotatingTextProps> = ({
    items = [],
    showLine = true,
    delayMs = 0,
    intervalMs = 3000,
    vertical = true,
    altDir = false,
    className = '',
    textClassName = '',
}) => {
    const [index, setIndex] = useState(0);
    const [lineWidth, setLineWidth] = useState(0);
    const [firstRender, setFirstRender] = useState(true);
    const textRef = React.useRef<HTMLSpanElement>(null);

    // Rotate words with initial delay
    useEffect(() => {
        if (items.length <= 1) return;

        const startTimeout = setTimeout(() => {
            setIndex((prev) => (prev + 1) % items.length);

            const interval = setInterval(() => {
                setIndex((prev) => (prev + 1) % items.length);
            }, intervalMs);

            // Cleanup interval on unmount
            return () => clearInterval(interval);
        }, delayMs + intervalMs); // first change after delay + interval

        return () => clearTimeout(startTimeout);
    }, [items.length, intervalMs, delayMs]);

    if (!items || items.length === 0) return null;

    return (
        <div className={`relative inline-block ${className} min-w-[400px]`}>
            <AnimatePresence mode="wait">
                <motion.span
                    key={index}
                    ref={textRef}
                    initial={{opacity: 0, filter: 'blur(8px)', x: (!vertical? 20 * (altDir ? -1: 1): 0), y: (vertical? 20 * (altDir ? -1: 1): 0)}}
                    animate={{opacity: 1, filter: 'blur(0px)', x: 0, y: 0}}
                    exit={{opacity: 0, filter: 'blur(8px)', x: (!vertical? -20 * (altDir ? -1: 1): 0), y: (vertical? -20 * (altDir ? -1: 1): 0)}}
                    transition={{duration: 0.5, ease: 'easeInOut'}}
                    onAnimationComplete={() => {
                        if (textRef.current) {
                            setLineWidth(textRef.current.offsetWidth);
                            if (firstRender) setFirstRender(false);
                        }
                    }}
                    className={`absolute top-0 whitespace-nowrap ${textClassName}`}
                >
                    {items[index]}
                </motion.span>
            </AnimatePresence>

            {/* Line grows from 0 only on first render, then always animates to new width */}
            {showLine && (
                <motion.div
                    className="absolute bottom-0 left-0 h-[1px] bg-red-500"
                    initial={{width: firstRender ? 0 : lineWidth}}
                    animate={{width: lineWidth}}
                    transition={{type: 'spring', stiffness: 300, damping: 40}}
                />
            )}

            {/* Invisible placeholder for layout */}
            <span className="invisible">{items[index]}</span>
        </div>
    );
};

export default RotatingText;