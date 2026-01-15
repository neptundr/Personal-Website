"use client";

import { motion } from "framer-motion";
import { Project } from "@/lib/api";

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      transition={{ type: "spring", stiffness: 200 }}
      className="bg-zinc-900 rounded-xl overflow-hidden shadow-lg"
    >
      <img
        src={project.image_url}
        alt={project.name}
        className="h-56 w-full object-cover"
      />
      <div className="p-6">
        <h3 className="text-2xl font-semibold">{project.name}</h3>
        <p className="text-sm text-zinc-400">{project.time_span}</p>
        {project.position && (
          <p className="mt-2 text-indigo-400">{project.position}</p>
        )}
        {project.description && (
          <p className="mt-4 text-zinc-300">{project.description}</p>
        )}
      </div>
    </motion.div>
  );
}