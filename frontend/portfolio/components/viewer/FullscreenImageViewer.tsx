'use client';

import {createPortal} from 'react-dom';
import {motion, AnimatePresence} from 'framer-motion';
import {ChevronLeft, ChevronRight, X} from 'lucide-react';
import React from 'react';

interface Props {
    images: string[];
    startIndex: number;
    onClose: () => void;
}

const FullscreenImageViewer: React.FC<Props> = ({images, startIndex, onClose}) => {
    const [index, setIndex] = React.useState(startIndex);
    const [isOpen, setIsOpen] = React.useState(true);

    const requestClose = () => setIsOpen(false);

    const prev = () => setIndex(i => (i - 1 + images.length) % images.length);
    const next = () => setIndex(i => (i + 1) % images.length);

    return createPortal(
        <AnimatePresence
            onExitComplete={onClose}
        >
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[9999] bg-black/55 flex flex-col backdrop-blur-md items-center justify-center"
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    exit={{opacity: 0}}
                    transition={{duration: 0.35, ease: 'easeOut'}}
                    onClick={requestClose}
                >
                    {/* Close */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            requestClose();
                        }}
                        className="absolute top-6 right-6 text-gray-400 hover:text-white transition"
                    >
                        <motion.div
                            whileHover={{scale: 1.25}}
                            transition={{type: 'spring', stiffness: 300}}
                        >
                            <X className="w-6 h-6"/>
                        </motion.div>
                    </button>

                    {/* Image */}
                    <motion.img
                        key={index}
                        src={images[index]}
                        className="
                        max-w-[95vw]
                        max-h-[70vh]
                        object-contain
                        rounded-xl
                        cursor-pointer
                        shadow-2xl
                    "
                        initial={{opacity: 0, scale: 0.96}}
                        animate={{opacity: 1, scale: 1}}
                        exit={{opacity: 0, scale: 0.96}}
                        transition={{duration: 0.4, ease: 'easeOut'}}
                        onClick={(e) => {
                            e.stopPropagation();
                            requestClose();
                        }}
                    />

                    {/* Controls */}
                    <div
                        className="
                        absolute bottom-6
                        left-1/2 -translate-x-1/2
                        flex items-center gap-6
                        text-gray-300 text-sm
                        bg-black/40
                        backdrop-blur-md
                        px-4 py-4
                        rounded-full
                    "
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={prev}
                            className="p-2 rounded-full hover:bg-white/15 hover:text-white duration-250 transition-all"
                        >
                            <ChevronLeft/>
                        </button>

                        <span className="opacity-70 whitespace-nowrap">
                        {index + 1} / {images.length}
                    </span>

                        <button
                            onClick={next}
                            className="p-2 rounded-full hover:bg-white/15 hover:text-white duration-250 transition-all"
                        >
                            <ChevronRight/>
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default FullscreenImageViewer;