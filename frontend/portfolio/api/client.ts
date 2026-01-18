const BASE_URL = "http://127.0.0.1:8000"; // FastAPI backend URL

export const api = {
    entities: {
        SiteSettings: {
            list: async () => {
                const res = await fetch(`${BASE_URL}/settings`);
                return [await res.json()]; // still return as array for consistency
            },
            create: async (data: any) => {
                const res = await fetch(`${BASE_URL}/settings`, {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify(data),
                });
                return await res.json();
            },
            update: async (id: number, data: any) => {
                const res = await fetch(`${BASE_URL}/settings/${id}`, {
                    method: "PUT",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify(data),
                });
                return await res.json();
            },
        },
        Project: {
            list: async () => {
                const res = await fetch(`${BASE_URL}/projects`);
                return await res.json();
            },
            create: async (data: any) => {
                const res = await fetch(`${BASE_URL}/projects`, {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify(data),
                });
                return await res.json();
            },
            update: async (id: number, data: any) => {
                const res = await fetch(`${BASE_URL}/projects/${id}`, {
                    method: "PUT",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify(data),
                });
                return await res.json();
            },
            delete: async (id: number) => {
                const res = await fetch(`${BASE_URL}/projects/${id}`, {method: "DELETE"});
                return res.ok;
            },
        },
        Education: {
            list: async () => {
                const res = await fetch(`${BASE_URL}/education`);
                return await res.json();
            },
            create: async (data: any) => {
                const res = await fetch(`${BASE_URL}/education`, {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify(data),
                });
                return await res.json();
            },
            update: async (id: number, data: any) => {
                const res = await fetch(`${BASE_URL}/education/${id}`, {
                    method: "PUT",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify(data),
                });
                return await res.json();
            },
            delete: async (id: number) => {
                const res = await fetch(`${BASE_URL}/education/${id}`, {method: "DELETE"});
                return res.ok;
            },
        },
        SkillIcon: {
            list: async () => {
                const res = await fetch(`${BASE_URL}/skills`);
                return await res.json();
            },
            create: async (data: any) => {
                const res = await fetch(`${BASE_URL}/skills`, {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify(data),
                });
                return await res.json();
            },
            delete: async (id: number) => {
                const res = await fetch(`${BASE_URL}/skills/${id}`, {method: "DELETE"});
                return res.ok;
            },
        },
    },

    uploadFile: async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`${BASE_URL}/upload`, {
            method: "POST",
            body: formData,
        });
        return await res.json(); // expect {file_url: "..."}
    },
};