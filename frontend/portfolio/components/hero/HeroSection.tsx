import React, {useRef, useState, useEffect} from 'react'
import {motion, AnimatePresence} from 'framer-motion'
import FractalTunnel from '@/components/hero/FractalTunnel'
import RotatingText from "@/components/hero/RotatingText";
import {ExternalLink} from "lucide-react";

interface HeroSectionProps {
    name?: string
    availableForHire?: boolean
    loveItems?: string[]
}

const HeroSection: React.FC<HeroSectionProps> = ({
                                                     name = 'Denis',
                                                     availableForHire = true,
                                                     loveItems = ["Create"]
                                                 }) => {
    const hasStartedRef = useRef(false)

    const [showMain, setShowMain] = useState(true)
    const [showWords, setShowWords] = useState(false)
    const [showPortfolio, setShowPortfolio] = useState(false)
    const [showFinal, setShowFinal] = useState(false)
    const [showPortfolioLine, setShowPortfolioLine] = useState(false)
    const [showBadge, setShowBadge] = useState(false)
    const [tunnelVisible, setTunnelVisible] = useState(false)
    const [showScrollHint, setShowScrollHint] = useState(false)
    const [skipIntro, setSkipIntro] = useState(false)
    const [showSkipButton, setShowSkipButton] = useState(true)


    /* ----------------------------
       SCROLL LOCK
    ---------------------------- */

    useEffect(() => {
        // Restore scroll to top on page reload / hard refresh
        if ('scrollRestoration' in window.history) {
            window.history.scrollRestoration = 'manual'
        }

        window.scrollTo({top: 0, left: 0, behavior: 'instant' as ScrollBehavior})
    }, [])

    useEffect(() => {
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = ''
        }
    }, [])

    /* ----------------------------
       INTRO SEQUENCE
    ---------------------------- */

    const handleSkip = () => {
        setSkipIntro(true)
        setShowMain(false)
        setShowWords(false)
        setShowPortfolio(false)
        setTunnelVisible(true)
        setShowFinal(true)
        setShowPortfolioLine(true)
        if (availableForHire) setShowBadge(true)
        setShowScrollHint(true)
        document.body.style.overflow = ''
    }

    useEffect(() => {
        if (hasStartedRef.current) return
        hasStartedRef.current = true

        if (skipIntro) return

        const timers: NodeJS.Timeout[] = []

        timers.push(setTimeout(() => {
            setShowMain(false)
        }, 2700))

        timers.push(setTimeout(() => {
            setShowWords(true)
        }, 3300))

        timers.push(setTimeout(() => {
            setShowWords(false)
        }, 4300))

        timers.push(setTimeout(() => {
            setShowPortfolio(true)
            setTunnelVisible(true)
            setShowSkipButton(false)
        }, 4600))

        timers.push(setTimeout(() => {
            setShowPortfolio(false)
            setShowFinal(true)
        }, 7000))

        timers.push(setTimeout(() => {
            setShowPortfolioLine(true)

        }, 8400))

        timers.push(setTimeout(() => {
            if (availableForHire) setShowBadge(true)
            document.body.style.overflow = ''
        }, 5000))

        timers.push(setTimeout(() => {
            setShowScrollHint(true)
        }, 11900))

        return () => timers.forEach(clearTimeout)
    }, [availableForHire])

    useEffect(() => {
        const onScroll = () => {
            setShowScrollHint(false)
        }
        window.addEventListener('scroll', onScroll)
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    const words = [
        {text: 'Welcome', left: '15vw', top: 'calc(var(--vh, 1vh) * 70)'},
        {text: 'to', left: '47vw', top: 'calc(var(--vh, 1vh) * 30)', center: true},
        {text: 'my', left: '75vw', top: 'calc(var(--vh, 1vh) * 50)', center: true},
    ]
    const wordVariants = {
        hidden: {opacity: 0},
        visible: (i: number) => ({
            opacity: 1,
            transition: {
                duration: 0.15,
                delay: i * (0.25 - 0.02 * i), // stagger ONLY on enter
            },
        }),
        exit: {
            opacity: 0,
            transition: {duration: 0.2}, // no delay → all disappear together
        },
    }

    return (
        <section className="relative w-full h-vh overflow-hidden">

            {/* FRACTAL TUNNEL (fade-in only) */}
            <motion.div
                className="absolute inset-0 bg-black"
                initial={{opacity: 1}}
                animate={{opacity: tunnelVisible ? 0 : 1}}
                transition={{
                    duration: 1.2, ease: 'easeOut'
                }}
            />

            <div className="relative z-10 w-full h-full">
                {!skipIntro && !showPortfolioLine && (
                    <motion.div className="absolute top-6 right-6 z-50" initial={{opacity: 1}} animate={{opacity: showSkipButton? 1: 0}}
                                transition={{
                                    duration: 1.2, ease: 'easeOut'
                                }}>
                        <button
                            className="px-3 py-1.5 rounded-lg bg-zinc-900/50 border border-white/40
                                text-white/90 hover:text-white hover:bg-zinc-700/80
                                transition-colors text-sm font-light tracking-wide backdrop-blur-sm"
                            onClick={handleSkip}
                            style={{fontFamily:"var(--font-codecBold)"}}
                        >
                            Skip Intro
                        </button>
                    </motion.div>
                )}

                {/* HEY / I'M DENIS */}
                <AnimatePresence>
                    {!skipIntro && showMain && (
                        <motion.div
                            exit={{opacity: 0}}
                            className="absolute bottom-16 left-6 md:left-12 lg:left-24"
                        >
                            <motion.h1
                                className="text-6xl sm:text-7xl md:text-9xl lg:text-[9rem] leading-tight text-white"
                                style={{fontFamily: 'var(--font-codec)'}}
                            >
                                <motion.span
                                    className="block font-extralight"
                                    initial={{opacity: 0, scale: 0.8, x: -100, y: 70}}
                                    animate={{opacity: 1, scale: 1, x: 0, y: 0}}
                                    transition={{
                                        type: 'spring',
                                        stiffness: 300,
                                        damping: 18,
                                        mass: 0.9, duration: 0.5, delay: 0.2
                                    }}
                                >
                                    Hey!
                                </motion.span>

                                <motion.span
                                    className="block font-extralight"
                                    initial={{opacity: 0, x: -30,}}
                                    animate={{opacity: 1, x: 0}}
                                    transition={{
                                        type: 'spring',
                                        stiffness: 190,
                                        damping: 28,
                                        mass: 0.5,
                                        duration: 0.6,
                                        delay: 0.9
                                    }}
                                >
                                    I'm{' '}
                                    <span className="relative inline-block font-light">
                                        {name}
                                        <motion.span
                                            className="absolute left-0 -bottom-1 h-[1px] bg-red-500"
                                            initial={{width: 0}}
                                            animate={{width: '103%'}}
                                            transition={{
                                                type: 'spring',
                                                stiffness: 290,
                                                damping: 28,
                                                mass: 0.85,
                                                delay: 1.5,
                                            }}
                                        />
                                    </span>
                                </motion.span>
                            </motion.h1>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* WELCOME / TO / MY */}
                <AnimatePresence>
                    {!skipIntro && showWords &&
                        words.map((w, i) => (
                            <motion.span
                                key={w.text}
                                custom={i}
                                variants={wordVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="absolute text-white font-codec text-5xl md:text-7xl"
                                style={{
                                    fontFamily: 'var(--font-codecBold)',
                                    left: w.left,
                                    top: w.top,
                                    transform: w.center ? 'translateX(-50%)' : undefined,
                                }}
                            >
                                {w.text}
                            </motion.span>
                        ))}
                </AnimatePresence>

                {/* PORTFOLIO */}
                <AnimatePresence>
                    {!skipIntro && showPortfolio && (
                        <motion.h1
                            initial={{opacity: 0, y: 120, filter: 'blur(1px)'}}
                            animate={{opacity: 1, y: 0, filter: 'blur(0px)'}}
                            exit={{opacity: 0, y: -1200, filter: 'blur(2px)'}}
                            transition={{
                                type: 'spring',
                                stiffness: 230,
                                damping: 75,
                                mass: 0.65,
                                duration: 1,
                                ease: 'easeOut'
                            }}
                            className="absolute top-1/2 left-1/2
                                       -translate-x-1/2 -translate-y-1/2
                                       text-white text-[clamp(4rem,18vw,12rem)]"
                            style={{fontFamily: 'var(--font-codecBold)'}}
                        >
                            Portfolio
                        </motion.h1>
                    )}
                </AnimatePresence>

                {/* RESTORED ENTRANCE */}
                <AnimatePresence>
                    {showFinal && (
                        <motion.div
                            className="absolute bottom-16 left-6 md:left-12 lg:left-24"
                            initial={{opacity: 0}}
                            animate={{opacity: 1}}
                            transition={{duration: 0.4}}
                        >
                            <div
                                className="text-5xl sm:text-7xl md:text-9xl lg:text-[9rem] text-white leading-tight"
                                style={{fontFamily: 'var(--font-codecBold)'}}
                            >
                                <motion.span
                                    className="block"
                                    initial={{opacity: 0, y: 40}}
                                    animate={{opacity: 1, y: 0}}
                                    transition={{duration: 0.6, delay: 0.1}}
                                >
                                    Let's
                                </motion.span>

                                <motion.span
                                    className="relative inline-block text-left justify-start"
                                    initial={{opacity: 0, y: 40}}
                                    animate={{opacity: 1, y: 0}}
                                    transition={{duration: 0.6, delay: 0.1}}
                                >
                                    <RotatingText items={loveItems}
                                                  textClassName="flex justify-start inline-block"/>

                                    <motion.div
                                        className="absolute left-0 -bottom-1 h-[1px] bg-red-500"
                                        layout // enables smooth width transitions
                                        transition={{type: 'spring', stiffness: 300, damping: 28}}
                                    />
                                </motion.span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* TOP LEFT TITLE + BADGE */}
                <AnimatePresence>
                    {showPortfolioLine && (
                        <motion.div
                            initial={{opacity: 0, y: -20}}
                            animate={{opacity: 1, y: 0}}
                            transition={{duration: 0.6}}
                            className="absolute top-18 left-6 md:left-12 lg:left-24 flex flex-col gap-3"
                        >
                            <span
                                className="text-white text-xl md:text-2xl"
                                style={{fontFamily: 'var(--font-codecBold)'}}
                            >
                                Denis Kaizer. Developer Portfolio
                            </span>

                            {availableForHire && showBadge && (<div>
                                <motion.a
                                    href="https://github.com/neptundr/Personal-Website"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    initial={{opacity: 0, y: -15}}
                                    animate={{opacity: 1, y: 0}}
                                    transition={{delay: 0.6, duration: 0.6}}
                                    className="group inline-flex w-fit items-center gap-2 px-3 py-1
                                        rounded-full border border-red-500/30 bg-red-500/10 backdrop-blur-md
                                        cursor-pointer transition-colors hover:border-red-500 hover:bg-red-500/55 hover:text-white duration-450 {/*hover:scale-105*/}"
                                >
                                        <span className="relative flex h-2 w-2">
                                            <span className="absolute inline-flex h-full w-full rounded-full
                                                             bg-red-500 group-hover:bg-white opacity-75 animate-ping transition-colors duration-300"/>
                                            <span
                                                className="relative inline-flex h-2 w-2 rounded-full bg-red-500 group-hover:bg-white transition-colors duration-300"/>
                                        </span>
                                    <span className="inline-flex items-center text-xs text-red-400 tracking-[0.2em] uppercase gap-1
                                                         transition-colors duration-300 group-hover:text-white">
                                            View Source
                                            <ExternalLink
                                                className="w-3 h-3 mb-0.5 opacity-100 transition-colors duration-300 group-hover:opacity-100 group-hover:text-white"/>
                                        </span>
                                </motion.a>
                            </div>)}

                            {/* MESSAGE BOX */}
                            {process.env.NEXT_PUBLIC_MESSAGE &&
                                process.env.NEXT_PUBLIC_MESSAGE.toLowerCase() !== 'none' && (
                                    <motion.div
                                        initial={{opacity: 0, y: 5}}
                                        animate={{opacity: 1, y: 0}}
                                        transition={{duration: 0.5, delay: 1}}
                                        className="mt-2 mr-6 px-3 py-1 max-w-90 rounded-md bg-red-500/20 text-white text-xs"
                                    >
                                        {process.env.NEXT_PUBLIC_MESSAGE}
                                    </motion.div>
                                )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* SCROLL DOWN HINT */}
                <AnimatePresence>
                    {showScrollHint && (
                        <motion.div
                            className="pointer-events-none absolute bottom-10 left-1/2 -translate-x-1/2"
                            initial={{opacity: 0, y: 10}}
                            animate={{
                                opacity: 1,
                                y: [0, -6, 0],
                            }}
                            exit={{opacity: 0, y: 10}}
                            transition={{
                                opacity: {duration: 0.6},
                                y: {
                                    duration: 2.2,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                },
                            }}
                        >
                            <span
                                className="inline-flex items-center gap-2 px-3 py-1
                                           rounded-full border border-red-500/30
                                           bg-red-500/10 backdrop-blur-md
                                           text-xs text-white-400 tracking-[0.2em] uppercase"
                                style={{fontFamily: 'var(--font-codec)'}}
                            >
                                Scroll Down
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </section>
    )
}

export default HeroSection