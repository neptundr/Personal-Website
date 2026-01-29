import {motion} from "framer-motion";
import React from "react";


const FooterSection = () => {
    return (
        <motion.div
            initial={{opacity: 0}}
            whileInView={{opacity: 1}}
            viewport={{once: true}}
            transition={{duration: 0.6, delay: 0.6}}
            className="
                w-full
                bg-black
                border-t border-zinc-900
                py-6
                text-center
                z-20
            "
        >
            <p className="text-gray-500 text-sm font-light">
                © {new Date().getFullYear()} Denis Kaizer. Crafted with passion.
            </p>
        </motion.div>
    );
}

export default FooterSection;