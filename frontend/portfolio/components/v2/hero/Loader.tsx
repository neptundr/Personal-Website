import type { CSSProperties, MutableRefObject, RefObject } from 'react';

// ":Denis Web" + progress. The ":D" isn't text: it's an empty slot sized like
// two glyphs, and the live face sits in it from the very first frame, so
// when loading ends the same face simply wakes up and hops away.

const REST = 'enis Web';
const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] as const;
const PLACES = [0, 1, 2] as const;

interface LoaderProps {
    rootRef: RefObject<HTMLDivElement | null>;
    slotRef: RefObject<HTMLSpanElement | null>;
    barRef: RefObject<HTMLSpanElement | null>;
    digitRefs: MutableRefObject<(HTMLSpanElement | null)[]>;
}

export default function Loader({ rootRef, slotRef, barRef, digitRefs }: LoaderProps) {
    return (
        <div
            ref={rootRef}
            className="v2-loader"
            role="progressbar"
            aria-label="Loading"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={0}
        >
            <p className="v2-loader__word" aria-label=":Denis Web">
                <span ref={slotRef} className="v2-loader__slot" aria-hidden="true" />
                <span className="v2-loader__rest" aria-hidden="true">
                    {Array.from(REST).map((ch, i) => (
                        <span key={i} className="v2-loader__char" style={{ '--i': i } as CSSProperties}>
                            {ch === ' ' ? ' ' : ch}
                        </span>
                    ))}
                </span>
            </p>
            <div className="v2-loader__meter" aria-hidden="true">
                <span className="v2-loader__track">
                    <span ref={barRef} className="v2-loader__bar" />
                </span>
                <span className="v2-loader__pct">
                    {PLACES.map((place) => (
                        <span key={place} className="v2-odo">
                            <span
                                ref={(el) => {
                                    digitRefs.current[place] = el;
                                }}
                                className="v2-odo__strip"
                            >
                                {DIGITS.map((d) => (
                                    <span key={d}>{d}</span>
                                ))}
                            </span>
                        </span>
                    ))}
                    <span className="v2-loader__sign">%</span>
                </span>
            </div>
        </div>
    );
}
