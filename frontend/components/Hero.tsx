"use client";

import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section className="h-screen flex items-center justify-center bg-black text-white">
      <motion.h1
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="text-7xl font-bold tracking-tight"
      >
        Hi! I&apos;m <span className="text-indigo-400">Denis Kaizer</span>
      </motion.h1>
    </section>
  );
}