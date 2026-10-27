import { loadHomeData } from '@/lib/home-data';
import HeroV2 from '@/components/v2/hero/HeroV2';

// Same ISR window as the classic home page.
export const revalidate = 3600;

export default async function HomeV2() {
    const { settings } = await loadHomeData();

    return (
        <main>
            <HeroV2 resumeUrl={settings.resume_url ?? null} />
        </main>
    );
}
