const API_BASE = "http://127.0.0.1:8000"; // FastAPI backend URL

export const api = {
    entities: {
        SiteSettings: {
            list: async () => {
                const res = await fetch(`${API_BASE}/settings`);
                return [await res.json()];
            },
        },
        Project: {
            list: async () => {
                const res = await fetch(`${API_BASE}/projects`);
                return await res.json();
            },
        },
        Education: {
            list: async () => {
                const res = await fetch(`${API_BASE}/education`);
                return await res.json();
            },
        },
        SkillIcon: {
            list: async () => {
                const res = await fetch(`${API_BASE}/skills`);
                return await res.json();
            },
        },
    },
};