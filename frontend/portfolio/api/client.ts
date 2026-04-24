// All requests now hit Next.js API routes at /api/* on the same origin —
// no cross-origin, no CORS, no cold-start backend.
const BASE_URL = "";

export const api = {
    entities: {
        SiteSettings: {
            list: async () => {
                const res = await fetch(`${BASE_URL}/api/settings`);
                const data = await res.json();
                // The route returns a single object (or {} when no row exists).
                // Keep historical array shape so callers using list[0] don't break.
                return Array.isArray(data) ? data : [data];
            },
            create: async (data: any) => {
                const res = await fetch(`${BASE_URL}/api/settings`, {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify(data),
                    credentials: "include"
                });
                return await res.json();
            },
            update: async (id: number, data: any) => {
                const res = await fetch(`${BASE_URL}/api/settings/${id}`, {
                    method: "PUT",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify(data),
                    credentials: "include"
                });
                return await res.json();
            },
        },
        Project: {
            list: async () => {
                const res = await fetch(`${BASE_URL}/api/projects`);
                return await res.json();
            },
            create: async (data: any) => {
                const res = await fetch(`${BASE_URL}/api/projects`, {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify(data),
                    credentials: "include"
                });
                return await res.json();
            },
            update: async (id: number, data: any) => {
                const res = await fetch(`${BASE_URL}/api/projects/${id}`, {
                    method: "PUT",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify(data),
                    credentials: "include"
                });
                return await res.json();
            },
            delete: async (id: number) => {
                const res = await fetch(`${BASE_URL}/api/projects/${id}`, {method: "DELETE", credentials: "include"});
                return res.ok;
            },
        },
        Education: {
            list: async () => {
                const res = await fetch(`${BASE_URL}/api/education`);
                return await res.json();
            },
            create: async (data: any) => {
                const res = await fetch(`${BASE_URL}/api/education`, {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify(data),
                    credentials: "include"
                });
                return await res.json();
            },
            update: async (id: number, data: any) => {
                const res = await fetch(`${BASE_URL}/api/education/${id}`, {
                    method: "PUT",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify(data),
                    credentials: "include"
                });
                return await res.json();
            },
            delete: async (id: number) => {
                const res = await fetch(`${BASE_URL}/api/education/${id}`, {method: "DELETE", credentials: "include"});
                return res.ok;
            },
        },
        SkillIcon: {
            list: async () => {
                const res = await fetch(`${BASE_URL}/api/skills`);
                return await res.json();
            },
            create: async (data: any) => {
                const res = await fetch(`${BASE_URL}/api/skills`, {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify(data),
                    credentials: "include"
                });
                return await res.json();
            },
            delete: async (id: number) => {
                const res = await fetch(`${BASE_URL}/api/skills/${id}`, {method: "DELETE", credentials: "include"});
                return res.ok;
            },
        },
    },

    uploadFile: async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`${BASE_URL}/api/upload`, {
            method: "POST",
            body: formData,
            credentials: "include"
        });
        return await res.json(); // {file_url, file_type}
    },
};
