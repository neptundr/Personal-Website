import {X} from "lucide-react";
import {motion} from "framer-motion";
import React from "react";

{/*{loveItems.length > 0 && (*/
}
{/*    <motion.p*/
}
{/*        initial={{opacity: 0}}*/
}
{/*        animate={{opacity: 1}}*/
}
{/*        transition={{duration: 0.8, delay: 1}}*/
}
{/*        className="mt-4 text-xl md:text-2xl text-gray-300 font-light tracking-wide"*/
}
{/*        style={{fontFamily: 'var(--font-codec)'}}*/
}
{/*    >*/
}
{/*        I love <RotatingText items={loveItems}/>*/
}
{/*    </motion.p>*/
}
{/*)}*/
}

<motion.div
    whileHover={{scale: 1.25}}
    transition={{type: 'spring', stiffness: 300}}
>
    <X className="w-3 h-3"/>
</motion.div>