// api/client.ts
export const api = {
  entities: {
    SiteSettings: {
      list: async () => {
        const res = await fetch("/settings");
        return [await res.json()];
      },
    },
    Project: {
      list: async () => {
        const res = await fetch("/projects");
        return await res.json();
      },
    },
    Education: {
      list: async () => {
        const res = await fetch("/education");
        return await res.json();
      },
    },
    SkillIcon: {
      list: async () => {
        const res = await fetch("/skills");
        return await res.json();
      },
    },
  },
};