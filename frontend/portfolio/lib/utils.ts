
export function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

const pageUrlMap: Record<string, string> = {
  Home: '/',
  AdminSettings: '/admin/settings',
  AdminProjects: '/admin/projects',
  AdminEducation: '/admin/education',
  AdminSkillIcons: '/admin/skillicons',
};

export const createPageUrl = (page: string): string => pageUrlMap[page] || '/';