
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getStudentLevel } from "@/lib/xp";

type LeaderboardEntry = {
  rank_position: number;
  nickname: string;
  total_xp: number;
  quizzes_completed: number;
  is_me: boolean;
};

type MyProfile = {
  nickname: string | null;
  is_visible: boolean;
  total_xp: number;
  quizzes_completed: number;
};

type MyRank = {
  rank_position: number;
  total_xp: number;
  quizzes_completed: number;
};

function formatXP(value: number) {
  return Number(value || 0).toLocaleString();
}

function getMedal(rank: number) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return "🎓";
}

function PodiumCard({
  student,
  featured = false,
}: {
  student?: LeaderboardEntry;
  featured?: boolean;
}) {
  if (!student) {
    return (
      <div className="flex min-h-40 min-w-0 flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-2 text-center text-xs text-slate-400 sm:min-h-56 sm:rounded-3xl sm:p-4">
        Position available
      </div>
    );
  }

  const level = getStudentLevel(Number(student.total_xp));

  return (
    <div
      className={`flex min-w-0 flex-1 flex-col items-center rounded-2xl border p-2 text-center shadow-sm sm:rounded-3xl sm:p-6 ${
        featured
          ? "border-amber-300 bg-gradient-to-b from-[#fff3ce] to-white shadow-lg shadow-amber-100 md:-translate-y-4"
          : "border-slate-200 bg-gradient-to-b from-slate-50 to-white"
      }`}
    >
      <div className="text-3xl sm:text-5xl">
        {getMedal(student.rank_position)}
      </div>

      <div
        className={`mt-3 flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-full text-xl font-black ${
          featured
            ? "bg-amber-100 text-amber-700"
            : "bg-blue-100 text-blue-700"
        }`}
      >
        {student.nickname.slice(0, 1).toUpperCase()}
      </div>

      <p className="mt-3 w-full break-words text-[11px] font-black text-slate-900 sm:text-base">
        {student.nickname}
      </p>

      {student.is_me && (
        <span className="mt-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
          You
        </span>
      )}

      <p className="mt-2 text-xs font-medium text-slate-500">
        Level {level.level}
      </p>

      <p className="mt-3 text-base font-black text-blue-600 sm:text-2xl">
        {formatXP(student.total_xp)}
        <span className="ml-1 text-[10px]">XP</span>
      </p>

      <p className="mt-2 text-xs text-slate-400">
        {student.quizzes_completed} quizzes
      </p>
    </div>
  );
}

export default function LeaderboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [profile, setProfile] =
    useState<MyProfile | null>(null);

  const [nickname, setNickname] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  const [leaders, setLeaders] =
    useState<LeaderboardEntry[]>([]);

  const [myRank, setMyRank] =
    useState<MyRank | null>(null);

  const loadLeaderboard = useCallback(async () => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      router.replace("/login");
      return;
    }

    const [
      profileResponse,
      leadersResponse,
      rankResponse,
    ] = await Promise.all([
      supabase
        .from("leaderboard_profiles")
        .select(
          "nickname,is_visible,total_xp,quizzes_completed"
        )
        .eq("user_id", user.id)
        .maybeSingle(),

      supabase.rpc("get_leaderboard", {
        p_limit: 50,
      }),

      supabase.rpc("get_my_leaderboard_rank"),
    ]);

    if (profileResponse.error) {
      throw profileResponse.error;
    }

    if (leadersResponse.error) {
      throw leadersResponse.error;
    }

    if (rankResponse.error) {
      throw rankResponse.error;
    }

    const savedProfile =
      (profileResponse.data as MyProfile | null) ?? null;

    setProfile(savedProfile);
    setNickname(savedProfile?.nickname ?? "");
    setIsVisible(savedProfile?.is_visible ?? false);

    setLeaders(
      (leadersResponse.data ?? []) as LeaderboardEntry[]
    );

    const rankData = (rankResponse.data ?? []) as MyRank[];

    setMyRank(rankData.length > 0 ? rankData[0] : null);
  }, [router]);

  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        await loadLeaderboard();
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load leaderboard."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    initialize();

    return () => {
      active = false;
    };
  }, [loadLeaderboard]);

  async function saveProfile(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const cleanNickname = nickname.trim();

    if (
      !/^[A-Za-z][A-Za-z0-9_]{2,19}$/.test(cleanNickname)
    ) {
      setError(
        "Nickname must be 3–20 characters, start with a letter, and use only letters, numbers, or underscores."
      );
      return;
    }

    setSaving(true);

    try {
      const { error: saveError } = await supabase.rpc(
        "set_leaderboard_profile",
        {
          p_nickname: cleanNickname,
          p_is_visible: isVisible,
        }
      );

      if (saveError) throw saveError;

      await loadLeaderboard();

      setSuccess(
        isVisible
          ? "Your nickname is saved and you're on the leaderboard!"
          : "Your nickname is saved. Your profile is private."
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to save your nickname.";

      if (
        message.includes("leaderboard_nickname_unique") ||
        message.includes("duplicate key")
      ) {
        setError(
          "This nickname is already taken. Please choose another."
        );
      } else {
        setError(message);
      }
    } finally {
      setSaving(false);
    }
  }

  const myXP = Number(profile?.total_xp ?? 0);
  const myLevel = getStudentLevel(myXP);
  const topThree = leaders.slice(0, 3);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
          <p className="mt-4 text-sm text-slate-500">
            Loading NexaTech Leaderboard...
          </p>
        </div>
      </main>
    );
  }

  // NEXATECH_LEADERBOARD_PREMIUM_PHASE6
  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: "▦" },
    { href: "/practice", label: "Practice", icon: "✎" },
    { href: "/ai-tutor", label: "AI Tutor", icon: "✦" },
    { href: "/progress", label: "Progress", icon: "◷" },
    { href: "/leaderboard", label: "Ranks", icon: "★" },
  ];

  return (
    <main className="min-h-screen bg-[#f3f6fd] text-[#101d3b] lg:pl-[266px]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[266px] flex-col bg-[#101d3d] px-5 py-7 text-white lg:flex">
        <Link href="/dashboard" className="flex items-center gap-3 px-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2463f6] text-xl font-black shadow-lg shadow-blue-950/30">N</div>
          <div><div className="text-lg font-extrabold">NexaTech</div><div className="text-[10px] font-bold tracking-widest text-blue-200/65">YOUR LEARNING SPACE</div></div>
        </Link>
        <nav className="mt-14 space-y-2" aria-label="Main navigation">
          {navItems.map(item => (
            <Link key={item.href} href={item.href} aria-current={item.href === "/leaderboard" ? "page" : undefined}
              className={`flex items-center gap-4 rounded-xl px-5 py-4 text-sm font-bold transition ${item.href === "/leaderboard" ? "bg-[#2463f6] text-white shadow-lg shadow-blue-950/20" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}>
              <span className="w-5 text-center text-lg">{item.icon}</span>{item.label === "Ranks" ? "Leaderboard" : item.label === "Practice" ? "Practice Exams" : item.label === "Progress" ? "My Progress" : item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto rounded-2xl border border-white/10 bg-white/[0.06] p-5">
          <div className="text-xl">✦</div><p className="mt-3 text-sm font-bold">Keep improving</p>
          <p className="mt-2 text-xs leading-5 text-slate-400">Small practice sessions build big results.</p>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-slate-200/80 bg-white/95 px-5 backdrop-blur-md sm:px-8 lg:px-10">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2463f6] font-black text-white shadow-md shadow-blue-200">N</div>
          <div><p className="text-sm font-extrabold leading-5">NexaTech</p><p className="text-[11px] font-semibold text-slate-400">Leaderboard</p></div>
        </Link>
        <Link href="/practice" className="rounded-xl bg-blue-50 px-4 py-2.5 text-xs font-extrabold text-[#2463f6] transition hover:bg-blue-100 sm:text-sm">+ Earn XP</Link>
      </header>

      <div className="mx-auto max-w-[1340px] space-y-7 px-4 pb-28 pt-7 sm:px-7 lg:px-9 lg:pb-12">
        <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#101d3d] via-[#183a85] to-[#2463f6] px-6 py-9 text-white shadow-xl shadow-blue-900/10 sm:px-10 sm:py-11">
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -right-16 h-80 w-80 rounded-full border-[45px] border-white/[0.05]" />
          <span className="relative inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-blue-100">🏆 NexaTech Scholars</span>
          <h1 className="relative mt-5 text-3xl font-black tracking-tight sm:text-5xl">The Hall of Champions</h1>
          <p className="relative mt-3 max-w-2xl text-sm leading-7 text-blue-100 sm:text-base">Every quiz brings you closer to the top. Celebrate your progress, earn XP, and climb the NexaTech leaderboard.</p>
          <Link href="/practice" className="relative mt-6 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-[#1d4ed8] shadow-md transition hover:bg-blue-50">Practice &amp; earn XP →</Link>
        </section>

        {error && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}
        {success && <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">{success}</div>}

        <section aria-label="Your leaderboard statistics" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {[
            { icon: "⚡", label: "Total XP", value: formatXP(myXP), sub: "Earned from quizzes" },
            { icon: "🎓", label: "Your Level", value: `Level ${myLevel.level}`, sub: myLevel.title },
            { icon: "🏅", label: "Your Rank", value: myRank && profile?.is_visible ? `#${myRank.rank_position}` : "Unranked", sub: profile?.is_visible ? "Public leaderboard" : "Opt in to be ranked" },
            { icon: "📝", label: "Quizzes Completed", value: String(profile?.quizzes_completed ?? 0), sub: "Keep the momentum" },
          ].map(stat => (
            <div key={stat.label} className="min-w-0 rounded-[22px] border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-xl">{stat.icon}</span>
              <p className="mt-4 text-xs font-bold text-slate-500 sm:text-sm">{stat.label}</p>
              <p className="mt-2 break-words text-2xl font-black tracking-tight sm:text-3xl">{stat.value}</p>
              <p className="mt-2 text-[11px] text-slate-400 sm:text-xs">{stat.sub}</p>
            </div>
          ))}
        </section>

        <section className="rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#2463f6]">YOUR LEARNING JOURNEY</p><h2 className="mt-2 text-xl font-black">Level {myLevel.level} · {myLevel.title}</h2></div>
            <span className="rounded-full bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700">{formatXP(myLevel.xpToNextLevel)} XP to next level</span>
          </div>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-blue-100"><div className="h-full rounded-full bg-gradient-to-r from-[#2463f6] to-[#65a6ff] transition-all duration-500" style={{ width: `${myLevel.progress}%` }} /></div>
          <p className="mt-3 text-xs font-medium text-slate-500">{myLevel.progress}% progress toward Level {myLevel.level + 1}</p>
        </section>

        <section className="rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-sm sm:p-8">
          <div className="mb-7 text-center"><p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#2463f6]">THE BEST OF NEXATECH</p><h2 className="mt-2 text-2xl font-black sm:text-3xl">🏆 Top Three Scholars</h2><p className="mt-2 text-sm text-slate-500">The students leading the way in earned XP.</p></div>
          {leaders.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 px-5 py-12 text-center"><p className="text-4xl">🏆</p><h3 className="mt-3 text-lg font-black">No public rankings yet</h3><p className="mt-2 text-sm text-slate-500">Opt in with a nickname to join the competition.</p></div>
          ) : (
            <div className="grid grid-cols-3 items-end gap-2 sm:gap-4">
              <PodiumCard student={topThree[1]} />
              <PodiumCard student={topThree[0]} featured />
              <PodiumCard student={topThree[2]} />
            </div>
          )}
        </section>

        <section className="rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-sm sm:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#2463f6]">THE RANKINGS</p><h2 className="mt-2 text-xl font-black sm:text-2xl">Student Leaderboard</h2><p className="mt-2 text-sm text-slate-500">Top 50 students ranked by total XP.</p></div><span className="rounded-full bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700">⚡ XP Ranking</span></div>
          {leaders.length === 0 ? <p className="py-12 text-center text-sm text-slate-400">No students have opted in yet.</p> : (
            <div className="space-y-2">
              {leaders.map(student => {
                const level = getStudentLevel(Number(student.total_xp));
                return <div key={`${student.rank_position}-${student.nickname}`} className={`flex min-w-0 items-center gap-3 rounded-2xl border px-3 py-3 sm:gap-5 sm:px-5 ${student.is_me ? "border-blue-300 bg-blue-50" : "border-slate-100 bg-[#fafcff]"}`}>
                  <span className="w-8 shrink-0 text-center text-base font-black sm:w-11 sm:text-lg">{student.rank_position <= 3 ? getMedal(student.rank_position) : `#${student.rank_position}`}</span>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-black text-blue-700 sm:h-12 sm:w-12">{student.nickname.slice(0,1).toUpperCase()}</span>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold sm:text-base">{student.nickname} {student.is_me && <span className="text-xs text-[#2463f6]">(You)</span>}</p><p className="mt-1 text-[11px] text-slate-500">Level {level.level} · {student.quizzes_completed} quizzes</p></div>
                  <div className="shrink-0 text-right"><p className="text-sm font-black text-[#2463f6] sm:text-lg">{formatXP(student.total_xp)}</p><p className="text-[10px] font-bold text-slate-400">XP</p></div>
                </div>;
              })}
            </div>
          )}
        </section>

        <section className="rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-sm sm:p-8">
          <div className="mb-6"><p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#2463f6]">PRIVACY &amp; IDENTITY</p><h2 className="mt-2 text-xl font-black sm:text-2xl">Your Leaderboard Profile</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Choose a unique nickname and decide whether other students can see your ranking. Your email and real name are not shown publicly.</p></div>
          <form onSubmit={saveProfile} className="max-w-2xl space-y-5">
            <div><label htmlFor="leaderboard-nickname" className="mb-2 block text-sm font-bold">Student nickname</label><input id="leaderboard-nickname" type="text" value={nickname} onChange={e => setNickname(e.target.value)} minLength={3} maxLength={20} required autoComplete="off" placeholder="e.g. MathWizard23" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /><p className="mt-2 text-xs text-slate-500">3–20 characters; start with a letter. Letters, numbers and underscores only.</p></div>
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4"><input type="checkbox" checked={isVisible} onChange={e => setIsVisible(e.target.checked)} className="mt-1 h-4 w-4 accent-blue-600" /><span><span className="block text-sm font-bold">Show me on the public leaderboard</span><span className="mt-1 block text-xs leading-5 text-slate-500">Other signed-in students can see your nickname, rank, XP, level and completed quiz count. Uncheck to stay private.</span></span></label>
            <button type="submit" disabled={saving} className="rounded-xl bg-[#2463f6] px-6 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">{saving ? "Saving..." : "Save Leaderboard Profile"}</button>
          </form>
        </section>
        <section className="rounded-[26px] bg-gradient-to-r from-[#122454] to-[#2463f6] p-7 text-white sm:p-9"><h2 className="text-2xl font-black">Ready to climb higher? 🚀</h2><p className="mt-3 max-w-xl text-sm leading-7 text-blue-100">Keep practicing, improve your skills, and earn more XP on your way to the top.</p><Link href="/practice" className="mt-5 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-blue-700">Start a practice exam →</Link></section>
        <footer className="text-center text-xs text-slate-400">NexaTech · Learn. Practice. Achieve.</footer>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-slate-200 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(15,23,42,0.06)] backdrop-blur-lg lg:hidden" aria-label="Mobile navigation">
        {navItems.map(item => <Link key={item.href} href={item.href} aria-current={item.href === "/leaderboard" ? "page" : undefined} className={`flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-3 text-[10px] font-bold ${item.href === "/leaderboard" ? "bg-blue-50 text-[#2463f6]" : "text-slate-500"}`}><span className="text-xl leading-none">{item.icon}</span><span className="truncate">{item.label}</span></Link>)}
      </nav>
    </main>
  );
}
