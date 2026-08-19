'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';

const slides = [
    {
        icon: (
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>
        ),
        title: 'Check in with one tap',
        text: 'The moment you arrive at Marino, tap once. No forms, no fuss — your visit is logged in seconds.',
    },
    {
        icon: (
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></svg>
        ),
        title: 'Build a streak that lasts',
        text: 'Hit a weekly goal instead of an impossible daily chain. Rest days are part of the plan.',
    },
    {
        icon: (
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
        ),
        title: 'Better with friends',
        text: 'Add the people you lift with and keep each other accountable. Private by default — visible to friends only.',
    },
];

export default function Onboarding() {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [index, setIndex] = useState(0);
    const isLast = index === slides.length - 1;

    function onScroll() {
        const el = scrollRef.current;
        if (!el) return;
        setIndex(Math.round(el.scrollLeft / el.clientWidth));
    }

    function goTo(i: number) {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
    }

    return (
        <main className="flex h-[100dvh] flex-col bg-[#f4f1ea] text-stone-800">
            <div className="flex items-center justify-between px-6 py-5">
                <span className="font-[family-name:var(--font-poppins)] text-lg font-extrabold tracking-tight">
                    Husky<span className="text-red-600">Lift</span>
                </span>
                <Link href="/login" className="text-sm font-semibold text-stone-500 transition hover:text-stone-800">
                    Log in
                </Link>
            </div>

            <div
                ref={scrollRef}
                onScroll={onScroll}
                className="flex flex-1 snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                {slides.map((s, i) => (
                    <div key={i} className="flex w-full shrink-0 snap-center flex-col items-center justify-center px-8 text-center">
                        <div className="mb-8 flex h-28 w-28 items-center justify-center rounded-[2rem] bg-red-600 text-white shadow-[0_0_60px_-15px_rgba(220,38,38,0.8)]">
                            {s.icon}
                        </div>
                        <h2 className="font-[family-name:var(--font-poppins)] max-w-xs text-3xl font-extrabold leading-tight tracking-tight">
                            {s.title}
                        </h2>
                        <p className="mt-4 max-w-xs text-stone-500">{s.text}</p>
                    </div>
                ))}
            </div>

            <div className="flex flex-col items-center gap-6 px-8 pb-10 pt-4">
                <div className="flex gap-2">
                    {slides.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => goTo(i)}
                            aria-label={`Go to slide ${i + 1}`}
                            className={`h-2 rounded-full transition-all ${i === index ? 'w-6 bg-red-600' : 'w-2 bg-stone-300'}`}
                        />
                    ))}
                </div>

                <div className="w-full max-w-xs">
                    {isLast ? (
                        <div className="flex flex-col gap-3">
                            <Link
                                href="/signup"
                                className="font-[family-name:var(--font-poppins)] block rounded-full bg-red-600 px-6 py-3.5 text-center font-semibold text-white shadow-sm transition hover:bg-red-700 active:scale-95"
                            >
                                Get started
                            </Link>
                            <Link
                                href="/login"
                                className="font-[family-name:var(--font-poppins)] block rounded-full border border-stone-300 bg-white/60 px-6 py-3.5 text-center font-semibold text-stone-700 transition hover:bg-white active:scale-95"
                            >
                                I already have an account
                            </Link>
                        </div>
                    ) : (
                        <button
                            onClick={() => goTo(index + 1)}
                            className="font-[family-name:var(--font-poppins)] w-full rounded-full bg-red-600 px-6 py-3.5 font-semibold text-white shadow-sm transition hover:bg-red-700 active:scale-95"
                        >
                            Next
                        </button>
                    )}
                </div>
            </div>
        </main>
    );
}