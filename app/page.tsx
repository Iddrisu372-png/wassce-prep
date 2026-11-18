// NEXATECH_PHASE3_INSTALLED
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const features = [
  {
    icon: "✦",
    title: "AI-powered learning",
    text: "Get extra support as you explore difficult concepts and strengthen your understanding.",
  },
  {
    icon: "✎",
    title: "Practice exams",
    text: "Build confidence through focused questions and timed practice sessions.",
  },
  {
    icon: "◉",
    title: "Instant results",
    text: "Review your performance, discover mistakes and learn from every attempt.",
  },
  {
    icon: "↗",
    title: "Track your progress",
    text: "Follow your learning journey with scores, achievements and useful insights.",
  },
  {
    icon: "★",
    title: "Student leaderboard",
    text: "Earn XP, celebrate milestones and challenge yourself to keep improving.",
  },
  {
    icon: "◎",
    title: "Learn anywhere",
    text: "Enjoy a responsive experience on your phone, tablet or computer.",
  },
];

const subjects = [
  { icon: "∑", name: "Mathematics", detail: "Numbers, algebra and problem-solving" },
  { icon: "Aa", name: "English Language", detail: "Grammar, comprehension and vocabulary" },
  { icon: "⚗", name: "Science", detail: "Explore the world through scientific ideas" },
  { icon: "◈", name: "Social Studies", detail: "Society, citizenship and global awareness" },
  { icon: "⌘", name: "ICT", detail: "Digital literacy and technology fundamentals" },
  { icon: "＋", name: "More subjects", detail: "Discover additional available subjects" },
];

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-xl font-black text-white shadow-lg shadow-blue-600/20">
        N
      </div>
      <div>
        <div className="text-lg font-black tracking-tight text-slate-950">
          NexaTech
        </div>
        <div className="text-[9px] font-extrabold uppercase tracking-[0.19em] text-blue-600">
          Learn beyond limits
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  // NEXATECH_AUTH_NAV_FIXED
  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((_event, session) => {
        if (!mounted) return;
        setSignedIn(Boolean(session));
        setAuthReady(true);
      });

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSignedIn(Boolean(data.session));
      setAuthReady(true);
    }).catch(() => {
      if (mounted) setAuthReady(true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const learningHref = signedIn ? "/dashboard" : "/login";
  const [activePreview, setActivePreview] = useState("Practice");

  // NEXATECH_PHASE2_INSTALLED
  useEffect(() => {
    const elements = document.querySelectorAll(".nexa-scroll-reveal");

    if (!("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("nexa-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("nexa-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px 40px 0px" }
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  return (
    <main className="nexa-phase3 min-h-screen overflow-x-hidden bg-[#f5f8ff] text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
          <Logo />

          <nav className="hidden items-center gap-8 text-sm font-bold text-slate-600 md:flex">
            <a href="#features" className="transition hover:text-blue-600">Features</a>
            <a href="#subjects" className="transition hover:text-blue-600">Subjects</a>
            <a href="#how-it-works" className="transition hover:text-blue-600">How it works</a>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            {authReady && (
              <>
                {!signedIn && (
                  <Link href="/login" className="rounded-xl px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100">
                    Log in
                  </Link>
                )}
                <Link href={learningHref} className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700">
                  {signedIn ? "Dashboard →" : "Get started →"}
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xl md:hidden"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>

        {menuOpen && (
          <nav className="nexa-mobile-menu flex flex-col gap-2 border-t border-slate-100 bg-white px-6 py-5 text-sm font-bold md:hidden">
            <a href="#features" onClick={() => setMenuOpen(false)} className="rounded-xl px-3 py-3 hover:bg-blue-50">Features</a>
            <a href="#subjects" onClick={() => setMenuOpen(false)} className="rounded-xl px-3 py-3 hover:bg-blue-50">Subjects</a>
            <a href="#how-it-works" onClick={() => setMenuOpen(false)} className="rounded-xl px-3 py-3 hover:bg-blue-50">How it works</a>
            {authReady && (
              <>
                {!signedIn && (
                  <Link href="/login" className="rounded-xl px-3 py-3 hover:bg-blue-50">
                    Log in
                  </Link>
                )}
                <Link href={learningHref} className="rounded-xl bg-blue-600 px-4 py-4 text-center text-white">
                  {signedIn ? "Dashboard →" : "Get started →"}
                </Link>
              </>
            )}
          </nav>
        )}
      </header>

      <section className="relative isolate overflow-hidden bg-[#101e43] text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-[#101b3a] via-[#173c87] to-[#2563eb]" />
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full border-[55px] border-white/5" />
        <div className="absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-blue-300/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 py-20 sm:px-8 lg:grid-cols-2 lg:py-28">
          <div>
            <span className="nexa-fade-up inline-flex rounded-full border border-blue-300/30 bg-white/10 px-4 py-2 text-xs font-extrabold tracking-wide text-blue-100">
              ✦ YOUR GLOBAL LEARNING COMPANION
            </span>

            <h1 className="nexa-fade-up nexa-delay-1 mt-8 max-w-2xl text-5xl font-black leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
              Learn smarter.
              <span className="mt-2 block text-[#91c7ff]">
                Achieve more.
              </span>
            </h1>

            <p className="nexa-fade-up nexa-delay-2 mt-7 max-w-xl text-base leading-8 text-blue-100/85 sm:text-lg">
              Your potential has no borders. Build confidence with
              practice exams, personalized learning support and
              powerful progress tracking — all in one place.
            </p>

            <div className="nexa-fade-up nexa-delay-3 mt-9 flex flex-wrap gap-4">
              <Link href={signedIn ? "/practice" : "/login"} className="rounded-2xl bg-white px-7 py-4 text-sm font-black text-blue-700 shadow-xl transition hover:-translate-y-1">
                {authReady && signedIn ? "Continue learning →" : "Start learning free →"}
              </Link>
              <a href="#features" className="rounded-2xl border border-white/30 bg-white/10 px-7 py-4 text-sm font-bold text-white transition hover:bg-white/20">
                Explore features
              </a>
            </div>

            <div className="nexa-fade-up nexa-delay-4 mt-12 flex flex-wrap gap-5 text-xs font-bold text-blue-100/90 sm:gap-7">
              <span>✓ Study at your pace</span>
              <span>✓ Track improvement</span>
              <span>✓ Learn anywhere</span>
            </div>
          </div>

          <div className="nexa-preview-enter relative mx-auto w-full max-w-lg">
            <div className="nexa-preview-card nexa-phase3-preview rounded-[32px] border border-white/20 bg-white/10 p-3 shadow-2xl backdrop-blur-xl sm:p-5">
              <div className="rounded-[24px] bg-white p-6 text-slate-900 shadow-xl sm:p-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 font-black text-white">N</div>
                    <div>
                      <div className="font-black">Your learning space</div>
                      <div className="text-xs text-slate-400">NexaTech overview</div>
                    </div>
                  </div>
                  <span className="rounded-full bg-green-50 px-3 py-2 text-xs font-bold text-green-700">● Ready</span>
                </div>

                <div className="mt-8 rounded-2xl bg-gradient-to-br from-[#142653] to-blue-600 p-6 text-white">
                  <div className="text-xs font-bold uppercase tracking-widest text-blue-200">Your journey</div>
                  <div className="mt-3 text-3xl font-black">Every step counts.</div>
                  <p className="mt-3 text-sm leading-6 text-blue-100">
                    Practice. Improve. Unlock your potential.
                  </p>
                  <div className="mt-7 h-2 overflow-hidden rounded-full bg-white/20">
                    <div className="h-full w-3/5 rounded-full bg-[#92caff]" />
                  </div>
                  <div className="mt-3 text-xs text-blue-100">Illustrative learning progress</div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  {[
                    { name: "Practice", icon: "✎", detail: "Build confidence", color: "bg-blue-50" },
                    { name: "AI Tutor", icon: "✦", detail: "Explore concepts", color: "bg-violet-50" },
                    { name: "Progress", icon: "↗", detail: "See improvement", color: "bg-emerald-50" },
                    { name: "Rewards", icon: "★", detail: "Celebrate growth", color: "bg-amber-50" },
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.name}
                      onClick={() => setActivePreview(item.name)}
                      aria-pressed={activePreview === item.name}
                      className={`${item.color} nexa-phase3-choice rounded-2xl border-2 p-5 text-left transition-all duration-300 hover:-translate-y-1 ${
                        activePreview === item.name
                          ? "border-blue-500 shadow-lg shadow-blue-100"
                          : "border-transparent"
                      }`}
                    >
                      <div className="text-2xl">{item.icon}</div>
                      <div className="mt-4 text-sm font-black">{item.name}</div>
                      <div className="mt-1 text-xs text-slate-500">{item.detail}</div>
                    </button>
                  ))}
                </div>

                <div
                  aria-live="polite"
                  className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/70 p-4"
                >
                  <div className="text-xs font-black uppercase tracking-wide text-blue-600">
                    {activePreview} preview
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {{
                      Practice: "Choose a subject, answer questions and improve with every session.",
                      "AI Tutor": "Explore challenging topics with your personal learning companion.",
                      Progress: "Follow your learning journey and celebrate improvements.",
                      Rewards: "Earn XP and discover your next milestone.",
                    }[activePreview]}
                  </p>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-3 rounded-2xl border border-white/70 bg-white px-5 py-4 text-sm font-black text-slate-800 shadow-xl sm:-left-8">
              ✨ Your future starts here
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="scroll-mt-28 px-6 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Why NexaTech</div>
            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
              Everything you need to grow.
            </h2>
            <p className="mt-5 leading-7 text-slate-500">
              A modern learning experience built to make studying more focused, engaging and rewarding.
            </p>
          </div>

          <div className="nexa-scroll-reveal mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="nexa-feature-card nexa-phase3-feature group rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm transition duration-300 hover:-translate-y-2 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/70">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl font-black text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                  {feature.icon}
                </div>
                <h3 className="mt-7 text-xl font-black">{feature.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-500">{feature.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="subjects" className="scroll-mt-28 bg-white px-6 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Explore learning</div>
              <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
                Discover your next subject.
              </h2>
              <p className="mt-5 leading-7 text-slate-500">
                Explore the subjects available in our current learning experience. More learning paths can be added as NexaTech grows.
              </p>
            </div>
            <Link href={signedIn ? "/practice" : "/login"} className="w-fit rounded-xl bg-blue-600 px-6 py-4 text-sm font-black text-white">
              Start practicing →
            </Link>
          </div>

          <div className="nexa-scroll-reveal mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subject) => (
              <div key={subject.name} className="nexa-phase3-subject flex items-start gap-4 rounded-2xl border border-slate-200 bg-[#f8faff] p-6 transition hover:border-blue-300 hover:bg-blue-50">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-lg font-black text-blue-600 shadow-sm">
                  {subject.icon}
                </div>
                <div>
                  <h3 className="font-black">{subject.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{subject.detail}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-slate-500">
            Current exam preparation includes WASSCE-focused practice. Additional curricula and international exams can be introduced in future updates.
          </p>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-28 px-6 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Simple and powerful</div>
            <h2 className="mt-4 text-3xl font-black sm:text-5xl">Three steps to progress.</h2>
          </div>
          <div className="nexa-scroll-reveal mt-14 grid gap-6 md:grid-cols-3">
            {[
              ["01", "Join NexaTech", "Create your student account and access your personal learning space."],
              ["02", "Practice and explore", "Choose a subject, complete practice sessions and use learning tools."],
              ["03", "Grow with every attempt", "Review results, track progress and build stronger skills over time."],
            ].map(([number, title, description]) => (
              <div key={number} className="nexa-phase3-step rounded-[28px] bg-white p-8 shadow-sm ring-1 ring-slate-200">
                <div className="text-5xl font-black text-blue-200">{number}</div>
                <h3 className="mt-7 text-xl font-black">{title}</h3>
                <p className="mt-4 text-sm leading-7 text-slate-500">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-20 sm:px-8 lg:pb-28">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[32px] bg-gradient-to-br from-[#11234d] via-[#1d469a] to-blue-600 px-7 py-16 text-center text-white sm:px-12 lg:py-24">
          <div className="absolute -right-20 -top-28 h-80 w-80 rounded-full border-[45px] border-white/5" />
          <div className="relative">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-blue-200">Your journey starts now</div>
            <h2 className="mx-auto mt-5 max-w-3xl text-4xl font-black leading-tight sm:text-5xl">
              Big dreams begin with small steps.
            </h2>
            <p className="mx-auto mt-6 max-w-xl leading-8 text-blue-100">
              Wherever you are, keep learning, keep practicing and move closer to your goals.
            </p>
            <Link href={learningHref} className="mt-9 inline-block rounded-2xl bg-white px-9 py-4 text-sm font-black text-blue-700 shadow-xl transition hover:-translate-y-1">
              {authReady && signedIn ? "Go to your dashboard →" : "Get started with NexaTech →"}
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-6 py-12 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 md:flex-row md:items-center">
          <div>
            <Logo />
            <p className="mt-4 text-sm text-slate-500">Empowering learners beyond borders.</p>
          </div>
          <div className="flex flex-wrap gap-6 text-sm font-bold text-slate-500">
            <a href="#features" className="hover:text-blue-600">Features</a>
            <a href="#subjects" className="hover:text-blue-600">Subjects</a>
            <Link href="/privacy" className="hover:text-blue-600">Privacy</Link>
            {authReady && (
              <Link href={learningHref} className="hover:text-blue-600">
                {signedIn ? "Dashboard" : "Student login"}
              </Link>
            )}
          </div>
        </div>
        <div className="mx-auto mt-10 max-w-7xl border-t border-slate-100 pt-7 text-center text-xs text-slate-400">
          © 2026 NexaTech. Learn. Practice. Achieve.
        </div>
      </footer>
    </main>
  );
}
