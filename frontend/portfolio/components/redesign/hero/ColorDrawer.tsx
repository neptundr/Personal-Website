'use client';
import React, { useState } from 'react';
import type { ColorConfig } from './liquid-config';

interface Props {
    config: ColorConfig;
    onChange: (c: ColorConfig) => void;
}

function ColorRow({
    label, value, onChangeColor,
}: { label: string; value: string; onChangeColor: (hex: string) => void }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.45 }}>
                {label}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                    type="color"
                    value={value}
                    onChange={e => onChangeColor(e.target.value)}
                    style={{ width: 32, height: 26, border: 'none', background: 'none', cursor: 'pointer', padding: 0, borderRadius: 3 }}
                />
                <input
                    type="text"
                    value={value}
                    maxLength={7}
                    onChange={e => { if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) onChangeColor(e.target.value); }}
                    style={{
                        flex: 1,
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#F9F9F9',
                        padding: '3px 8px',
                        borderRadius: 3,
                        fontSize: 12,
                        fontFamily: 'monospace',
                    }}
                />
            </div>
        </div>
    );
}

function ThresholdRow({
    label, value, onChange,
}: { label: string; value: number; onChange: (v: number) => void }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.45 }}>{label}</span>
                <span style={{ fontSize: 11, fontFamily: 'monospace', opacity: 0.7 }}>{value.toFixed(2)}</span>
            </div>
            <input
                type="range" min={0} max={1} step={0.01} value={value}
                onChange={e => onChange(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#D60064', cursor: 'pointer' }}
            />
        </div>
    );
}

export default function ColorDrawer({ config, onChange }: Props) {
    const [open, setOpen] = useState(false);

    const [c0, c1, c2, c3] = config.colors;
    const [t0, t1, t2]     = config.thresholds;

    function setColor(idx: 0 | 1 | 2 | 3, hex: string) {
        const next: [string, string, string, string] = [...config.colors];
        next[idx] = hex;
        onChange({ ...config, colors: next });
    }

    function setThreshold(idx: 0 | 1 | 2, val: number) {
        const next: [number, number, number] = [...config.thresholds];
        next[idx] = val;
        onChange({ ...config, thresholds: next });
    }

    const W = 268;

    return (
        <>
            {/* Slide-out tab */}
            <button
                onClick={() => setOpen(o => !o)}
                aria-label={open ? 'Close colour drawer' : 'Open colour drawer'}
                style={{
                    position: 'fixed',
                    right: open ? W : 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 55,
                    background: '#1D0118',
                    color: '#F9F9F9',
                    border: '1px solid rgba(255,255,255,0.14)',
                    padding: '10px 5px',
                    borderRadius: '4px 0 0 4px',
                    cursor: 'pointer',
                    writingMode: 'vertical-rl',
                    fontSize: 10,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    fontFamily: 'monospace',
                    transition: 'right 0.28s ease',
                    userSelect: 'none',
                }}
            >
                {open ? '✕' : 'Colors'}
            </button>

            {/* Panel */}
            <div
                style={{
                    position: 'fixed',
                    right: open ? 0 : -W,
                    top: 0, bottom: 0,
                    width: W,
                    zIndex: 50,
                    background: 'rgba(16,0,13,0.96)',
                    borderLeft: '1px solid rgba(255,255,255,0.1)',
                    padding: '28px 18px',
                    overflowY: 'auto',
                    transition: 'right 0.28s ease',
                    backdropFilter: 'blur(10px)',
                    color: '#F9F9F9',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 18,
                    fontFamily: 'sans-serif',
                }}
            >
                <div style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.4 }}>
                    Colour map
                </div>

                <ColorRow label="Darkest (bg)"  value={c0} onChangeColor={h => setColor(0, h)} />
                <ColorRow label="Dark mid"       value={c1} onChangeColor={h => setColor(1, h)} />
                <ColorRow label="Light mid"      value={c2} onChangeColor={h => setColor(2, h)} />
                <ColorRow label="Lightest"       value={c3} onChangeColor={h => setColor(3, h)} />

                <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />

                <div style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.4 }}>
                    Thresholds (luminance 0–1)
                </div>

                <ThresholdRow label="dark → mid"        value={t0} onChange={v => setThreshold(0, v)} />
                <ThresholdRow label="mid → light-mid"   value={t1} onChange={v => setThreshold(1, v)} />
                <ThresholdRow label="light-mid → light" value={t2} onChange={v => setThreshold(2, v)} />

                <div style={{ fontSize: 9, opacity: 0.22, marginTop: 6 }}>
                    Testing panel — changes apply live
                </div>
            </div>
        </>
    );
}
