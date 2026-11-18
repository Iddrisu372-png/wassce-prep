"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { calculateTotalXP, getStudentLevel } from "@/lib/xp";

type QuizResult = { id: string; score: number; total_questions: number; subject: string; created_at: string };

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [imageFailed, setImageFailed] = useState(false);
  const [joined, setJoined] = useState("");
  const [results, setResults] = useState<QuizResult[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (!active) return;
        if (authError || !user) { router.replace("/login"); return; }
        setName(user.user_metadata?.full_name || user.user_metadata?.name || "");
        setEmail(user.email || "");
        setAvatarUrl(user.user_metadata?.avatar_url || "");
        setJoined(user.created_at || "");
        const all: QuizResult[] = [];
        let from = 0;
        while (true) {
          const { data, error: queryError } = await supabase.from("quiz_results")
            .select("id,score,total_questions,subject,created_at")
            .eq("user_id", user.id).order("created_at", { ascending: false })
            .range(from, from + 499);
          if (queryError) throw queryError;
          if (!active) return;
          const page = (data || []) as QuizResult[];
          all.push(...page);
          if (page.length < 500) break;
          from += 500;
        }
        if (active) setResults(all);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Unable to load your profile.");
      } finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [router]);

  const stats = useMemo(() => {
    const xp = calculateTotalXP(results);
    const level = getStudentLevel(xp);
    const percentages = results.map(r => r.total_questions > 0 ? Math.max(0, Math.min(100, Math.round(r.score / r.total_questions * 100))) : 0);
    const average = percentages.length ? Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length) : 0;
    return { xp, level, average, quizzes: results.length, subjects: new Set(results.map(r => r.subject).filter(Boolean)).size };
  }, [results]);

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setMessage(""); setError("");
    const cleaned = name.trim().replace(/\s+/g, " ");
    if (cleaned.length < 2 || cleaned.length > 60) { setError("Enter a name between 2 and 60 characters."); return; }
    setSaving(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ data: { full_name: cleaned } });
      if (updateError) throw updateError;
      setName(cleaned);
      setMessage("Profile updated successfully. Your dashboard will show the new name when you return.");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save your profile."); }
    finally { setSaving(false); }
  }

  async function logout() {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) { setError(signOutError.message); return; }
    router.replace("/login");
  }

  const initials = name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0].toUpperCase()).join("") || "S";
  const links = [
    { href: "/dashboard", label: "Dashboard", icon: "▦" },
    { href: "/practice", label: "Practice", icon: "✎" },
    { href: "/ai-tutor", label: "AI Tutor", icon: "✦" },
    { href: "/progress", label: "Progress", icon: "◷" },
    { href: "/leaderboard", label: "Ranks", icon: "★" },
  ];

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">Loading your NexaTech profile...</main>;

  return (
    <main className="min-h-screen bg-[#f5f7fc] text-slate-900 lg:pl-64">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-[#101b38] px-5 py-7 text-white lg:flex">
        <Link href="/dashboard" className="mb-12 flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-xl font-black">N</span><span><span className="block text-lg font-black">NexaTech</span><span className="block text-[10px] uppercase tracking-widest text-slate-400">Your learning space</span></span></Link>
        <nav className="space-y-2" aria-label="Desktop navigation">{links.map(x => <Link key={x.href} href={x.href} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white"><span className="w-6 text-center text-xl">{x.icon}</span>{x.label}</Link>)}<Link href="/profile" aria-current="page" className="flex items-center gap-3 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold"><span className="w-6 text-center text-xl">◉</span>My Profile</Link></nav>
        <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">✦ Keep improving every day.</div>
      </aside>
      <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-slate-200 bg-white/95 px-5 backdrop-blur-xl lg:px-10"><Link href="/dashboard" className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-black text-white">N</span><span><strong className="block text-sm">NexaTech</strong><span className="block text-xs text-slate-500">Student Profile</span></span></Link><Link href="/dashboard" className="rounded-xl bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100">← Dashboard</Link></header>
      <div className="mx-auto max-w-6xl px-4 pb-28 pt-8 sm:px-6 lg:px-8 lg:pb-12">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#10244d] via-[#1d4294] to-[#2563eb] p-7 text-white shadow-lg sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-200">NexaTech student identity</p>
          <div className="mt-7 flex flex-wrap items-center gap-5">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white/50 bg-blue-100 text-3xl font-black text-blue-700">{avatarUrl && !imageFailed ? <img src={avatarUrl} alt="Profile avatar" className="h-full w-full object-cover" onError={() => setImageFailed(true)} /> : initials}</div>
            <div className="min-w-0"><h1 className="break-words text-3xl font-black sm:text-4xl">{name || "Student"}</h1><p className="mt-2 break-all text-sm text-blue-100">{email}</p><p className="mt-3 text-sm font-semibold text-blue-100">🎓 Level {stats.level.level} · {stats.level.title}</p></div>
          </div>
          <div className="mt-8 h-3 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-amber-300" style={{ width: `${stats.level.progress}%` }} /></div>
          <p className="mt-2 text-xs text-blue-100">{stats.level.xpToNextLevel.toLocaleString()} XP to your next level</p>
        </section>
        <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">{[
          ["⚡", "Total XP", stats.xp.toLocaleString()],
          ["📝", "Quizzes", String(stats.quizzes)],
          ["🎯", "Average score", `${stats.average}%`],
          ["📚", "Subjects", String(stats.subjects)],
        ].map(([icon, label, value]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="text-2xl">{icon}</div><p className="mt-4 text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 text-2xl font-black">{value}</p></div>)}</section>
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:col-span-2"><h2 className="text-xl font-black">Edit your profile</h2><p className="mt-2 text-sm text-slate-500">Update the name shown on your student dashboard.</p>
            <form onSubmit={saveProfile} className="mt-6 space-y-5"><div><label htmlFor="student-name" className="mb-2 block text-sm font-bold">Display name</label><input id="student-name" value={name} onChange={e => setName(e.target.value)} maxLength={60} required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></div><div><label htmlFor="student-email" className="mb-2 block text-sm font-bold">Account email</label><input id="student-email" value={email} readOnly className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-500" /><p className="mt-2 text-xs text-slate-400">Email changes are not available on this page.</p></div>
              {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}{message && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
              <button type="submit" disabled={saving} className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60">{saving ? "Saving..." : "Save changes"}</button></form>
          </section>
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><h2 className="text-xl font-black">Your account</h2><p className="mt-4 text-sm text-slate-500">Member since</p><p className="mt-1 font-bold">{joined ? new Date(joined).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "Not available"}</p><div className="mt-7 space-y-3"><Link href="/progress" className="block rounded-xl bg-blue-50 px-4 py-3 text-center text-sm font-bold text-blue-700">View learning progress →</Link><Link href="/leaderboard" className="block rounded-xl bg-slate-100 px-4 py-3 text-center text-sm font-bold text-slate-700">View leaderboard →</Link><button type="button" onClick={logout} className="w-full rounded-xl border border-red-200 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50">Log out</button></div></section>
        </div>
        <p className="mt-10 text-center text-xs text-slate-400">NexaTech · Learn. Practice. Achieve.</p>
      </div>
      <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white px-1 pb-[env(safe-area-inset-bottom)] shadow-lg lg:hidden"><div className="mx-auto grid max-w-xl grid-cols-5 gap-1">{links.map(x => <Link key={x.href} href={x.href} className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-semibold text-slate-500 hover:text-blue-600"><span className="text-xl">{x.icon}</span><span className="truncate">{x.label}</span></Link>)}</div></nav>
    </main>
  );
}
