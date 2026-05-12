import React from 'react';

interface Segment {
    text: string;
    bold: boolean;
}

function parseRichText(text: string): Segment[] {
    const result: Segment[] = [];
    const regex = /\*\*(.*?)\*\*/g;
    let last = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > last) {
            result.push({text: text.slice(last, match.index), bold: false});
        }
        result.push({text: match[1]!, bold: true});
        last = match.index + match[0].length;
    }

    if (last < text.length) {
        result.push({text: text.slice(last), bold: false});
    }

    return result.length > 0 ? result : [{text, bold: false}];
}

/**
 * Render a description string that may contain **bold** markers.
 * boldColor: CSS color for bold segments. Omit to inherit parent color.
 */
export function renderRichText(text: string, boldColor?: string): React.ReactNode {
    const segments = parseRichText(text);
    return segments.map((seg, i) =>
        seg.bold ? (
            <span
                key={i}
                style={{
                    fontFamily: 'var(--font-codecBold)',
                    ...(boldColor ? {color: boldColor} : {}),
                }}
            >
                {seg.text}
            </span>
        ) : (
            <React.Fragment key={i}>{seg.text}</React.Fragment>
        )
    );
}
