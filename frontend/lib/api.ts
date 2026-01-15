export type Project = {
  id: number;
  name: string;
  image_url: string;
  time_span: string;
  description?: string;
  position?: string;
};

export async function fetchProjects(): Promise<Project[]> {
  const res = await fetch("http://localhost:8000/projects");
  if (!res.ok) throw new Error("Failed to fetch projects");
  return res.json();
}