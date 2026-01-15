"use client";

import { useEffect, useState } from "react";
import { fetchProjects, Project } from "@/lib/api";
import ProjectCard from "./ProjectCard";

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    fetchProjects().then(setProjects);
  }, []);

  return (
    <section className="bg-zinc-950 text-white px-12 py-24">
      <h2 className="text-4xl font-semibold mb-16">Projects</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {projects.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </div>
    </section>
  );
}