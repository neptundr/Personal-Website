import HeroStage from './HeroStage';
import TopBar from '../nav/TopBar';
import DevPanel from '../dev/DevPanel';
// @ts-ignore
import './hero.css';

interface HeroV2Props {
    resumeUrl: string | null;
}

// `data-stage` flips from "loading" to "live" when the :D lands; CSS uses it
// to bring in the top bar.
export default function HeroV2({ resumeUrl }: HeroV2Props) {
    return (
        <section id="top" className="v2-hero" data-stage="loading" aria-labelledby="v2-hero-title">
            <h1 id="v2-hero-title" className="v2-sr-only">
                Welcome! This is Denis Kaizer&apos;s website.
            </h1>
            <HeroStage />
            <TopBar resumeUrl={resumeUrl} />
            <DevPanel />
        </section>
    );
}
