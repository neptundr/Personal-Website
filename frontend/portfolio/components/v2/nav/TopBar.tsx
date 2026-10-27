'use client';

import { useCallback, useId, useRef, useState, type CSSProperties, type FocusEvent, type KeyboardEvent } from 'react';
import { signalFace } from '../face/face-bus';
// @ts-ignore
import './top-bar.css';

// Denis Kaizer ………… (Hiring?) (:)
// One underline is shared by every link and springs from one to the next in
// any direction, including down into the menu. Hovers poke the :D:
// name → spin, Hiring? → $-eyes, menu → nod or :O.

const MENU = [
    { label: 'Projects', href: '#projects' },
    { label: 'Experience', href: '#experience' },
    { label: 'Academics', href: '#academics' },
    { label: 'Contacts', href: '#contacts' },
] as const;

interface TopBarProps {
    resumeUrl: string | null;
}

export default function TopBar({ resumeUrl }: TopBarProps) {
    const barRef = useRef<HTMLElement>(null);
    const lineRef = useRef<HTMLSpanElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [open, setOpen] = useState(false);
    const menuId = useId();

    const moveLine = useCallback((target: HTMLElement) => {
        const bar = barRef.current;
        const line = lineRef.current;
        if (!bar || !line) return;
        const text = target.querySelector<HTMLElement>('[data-u-text]') ?? target;
        const b = bar.getBoundingClientRect();
        const r = text.getBoundingClientRect();
        const x = `${(r.left - b.left).toFixed(1)}px`;
        const y = `${(r.bottom - b.top + 3).toFixed(1)}px`;
        const w = r.width.toFixed(1);
        if (line.dataset.on !== 'true') {
            // Appearing: start collapsed in place, then grow, instead of flying in from the corner.
            line.style.transition = 'none';
            line.style.setProperty('--x', x);
            line.style.setProperty('--y', y);
            line.style.setProperty('--w', '0');
            void line.offsetWidth;
            line.style.transition = '';
        }
        line.dataset.on = 'true';
        line.style.setProperty('--x', x);
        line.style.setProperty('--y', y);
        line.style.setProperty('--w', w);
    }, []);

    const hideLine = useCallback(() => {
        const line = lineRef.current;
        if (!line) return;
        line.dataset.on = 'false';
        line.style.setProperty('--w', '0');
    }, []);

    const openMenu = useCallback(() => {
        setOpen((was) => {
            if (!was) signalFace({ type: 'agree' });
            return true;
        });
    }, []);

    const closeMenu = useCallback(() => setOpen(false), []);

    const onMenuKey = (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key !== 'Escape') return;
        closeMenu();
        buttonRef.current?.focus();
    };

    const onMenuBlur = (e: FocusEvent<HTMLDivElement>) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) closeMenu();
    };

    const hireHref = resumeUrl ?? '#contacts';
    const external = resumeUrl !== null;

    return (
        <header ref={barRef} className="v2-top" onPointerLeave={hideLine}>
            <a
                className="v2-top__name"
                href="#top"
                onPointerEnter={(e) => {
                    moveLine(e.currentTarget);
                    signalFace({ type: 'spin' });
                }}
                onFocus={(e) => moveLine(e.currentTarget)}
                onBlur={hideLine}
            >
                <span data-u-text="">Denis Kaizer</span>
            </a>

            <nav className="v2-top__right" aria-label="Main navigation">
                <a
                    className="v2-top__hire"
                    href={hireHref}
                    {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    onPointerEnter={(e) => {
                        moveLine(e.currentTarget);
                        signalFace({ type: 'money', on: true });
                    }}
                    onPointerLeave={() => signalFace({ type: 'money', on: false })}
                    onFocus={(e) => {
                        moveLine(e.currentTarget);
                        signalFace({ type: 'money', on: true });
                    }}
                    onBlur={() => {
                        hideLine();
                        signalFace({ type: 'money', on: false });
                    }}
                >
                    <span data-u-text="">Hiring?</span>
                </a>

                <div
                    className="v2-menu"
                    data-open={open}
                    onPointerEnter={openMenu}
                    onPointerLeave={closeMenu}
                    onKeyDown={onMenuKey}
                    onBlur={onMenuBlur}
                >
                    <button
                        ref={buttonRef}
                        type="button"
                        className="v2-menu__button"
                        aria-expanded={open}
                        aria-controls={menuId}
                        aria-label={open ? 'Close menu' : 'Open menu'}
                        onClick={() => (open ? closeMenu() : openMenu())}
                    >
                        <span className="v2-menu__dots" aria-hidden="true">
                            <i />
                            <i />
                        </span>
                    </button>
                    <ul id={menuId} className="v2-menu__list">
                        {MENU.map((item, i) => (
                            <li key={item.href} style={{ '--i': i } as CSSProperties}>
                                <a
                                    href={item.href}
                                    tabIndex={open ? 0 : -1}
                                    onPointerEnter={(e) => {
                                        moveLine(e.currentTarget);
                                        signalFace({ type: 'agree' });
                                    }}
                                    onFocus={(e) => moveLine(e.currentTarget)}
                                    onClick={closeMenu}
                                >
                                    <span data-u-text="">{item.label}</span>
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            </nav>

            <span ref={lineRef} className="v2-top__line" aria-hidden="true" />
        </header>
    );
}
