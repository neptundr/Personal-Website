'use client';

import {motion} from "framer-motion";
import React from "react";


const FooterSection = () => {
    return (
        <motion.div
            initial={{opacity: 0}}
            whileInView={{opacity: 1}}
            viewport={{once: true}}
            transition={{duration: 0.4, delay: 1.2}}
            className="
                w-full
                bg-[var(--surface)]
                border-t border-[color-mix(in_oklab,var(--ink)_14%,transparent)]
                py-6
                text-center
                z-20
            "
        >
            <p className="text-[color-mix(in_oklab,var(--ink)_55%,transparent)] text-sm font-light">
                © {new Date().getFullYear()} Denis Kaizer. Crafted with passion.
            </p>
        </motion.div>
    );
}

export default FooterSection;