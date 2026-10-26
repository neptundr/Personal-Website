import { loadHomeData } from '@/lib/home-data';

// Same ISR window as the classic home page.
export const revalidate = 3600;

// Placeholder: confirms the redesign route is wired to the shared backend.
// Build the new sections in components/v2/ and compose them here.
export default async function HomeV2() {
    const { settings, projects, education, skillIcons } = await loadHomeData();

    return (
        <main style={{ padding: 'var(--v2-space-section) 1rem' }}>
            <h1>{settings.hero_name || 'Denis'}: v2</h1>
            <p style={{ color: 'var(--v2-muted)' }}>
                {projects.length} projects · {education.length} education entries ·{' '}
                {skillIcons.length} skill icons
            </p>
        </main>
    );
}
