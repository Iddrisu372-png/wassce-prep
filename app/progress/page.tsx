
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  calculateTotalXP,
  getStudentLevel,
} from "@/lib/xp";

type QuizResult = {
  id: string;
  user_id: string;
  subject: string;
  score: number;
  total_questions: number;
  created_at: string;
};

type SubjectStats = {
  name: string;
  quizzes: number;
  average: number;
  best: number;
};

type Achievement = {
  icon: string;
  title: string;
  description: string;
  unlocked: boolean;
};

function getPercentage(result: QuizResult): number {
  const total = Number(result.total_questions);
  const score = Number(result.score);

  if (
    !Number.isFinite(total) ||
    !Number.isFinite(score) ||
    total <= 0
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(100, Math.round((score / total) * 100))
  );
}

function dateKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function getStreaks(results: QuizResult[]) {
  const activityDays = new Set(
    results
      .map((result) => new Date(result.created_at))
      .filter((date) => !Number.isNaN(date.getTime()))
      .map(dateKey)
  );

  const sortedDays = [...activityDays].sort();

  if (sortedDays.length === 0) {
    return { current: 0, longest: 0 };
  }

  let longest = 0;
  let running = 0;
  let previous: Date | null = null;

  for (const key of sortedDays) {
    const date = new Date(`${key}T12:00:00`);

    if (
      previous &&
      Math.round(
        (date.getTime() - previous.getTime()) /
          86400000
      ) === 1
    ) {
      running++;
    } else {
      running = 1;
    }

    longest = Math.max(longest, running);
    previous = date;
  }

  const cursor = new Date();

  if (!activityDays.has(dateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let current = 0;

  while (activityDays.has(dateKey(cursor))) {
    current++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { current, longest };
}

function getSubjectStats(
  results: QuizResult[]
): SubjectStats[] {
  const grouped: Record<
    string,
    { count: number; total: number; best: number }
  > = {};

  for (const result of results) {
    const subject = result.subject || "Other";
    const percent = getPercentage(result);

    if (!grouped[subject]) {
      grouped[subject] = {
        count: 0,
        total: 0,
        best: 0,
      };
    }

    grouped[subject].count++;
    grouped[subject].total += percent;
    grouped[subject].best = Math.max(
      grouped[subject].best,
      percent
    );
  }

  return Object.entries(grouped)
    .map(([name, data]) => ({
      name,
      quizzes: data.count,
      average: Math.round(data.total / data.count),
      best: data.best,
    }))
    .sort((a, b) => b.average - a.average);
}

function MetricCard({
  icon,
  title,
  value,
  description,
}: {
  icon: string;
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg sm:p-6">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
        {icon}
      </div>

      <p className="text-sm font-semibold text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">
        {value}
      </p>

      <p className="mt-2 text-xs leading-relaxed text-slate-400">
        {description}
      </p>
    </div>
  );
}

function ProgressChart({
  results,
}: {
  results: QuizResult[];
}) {
  const recent = [...results].reverse().slice(-12);

  if (recent.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">
        Complete a quiz to see your performance chart.
      </div>
    );
  }

  const width = 720;
  const height = 270;
  const left = 48;
  const right = 22;
  const top = 22;
  const bottom = 45;

  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;

  const points = recent.map((result, index) => {
    const x =
      recent.length === 1
        ? left + plotWidth / 2
        : left +
          (index / (recent.length - 1)) * plotWidth;

    const score = getPercentage(result);

    const y =
      top + plotHeight * (1 - score / 100);

    return { x, y, score };
  });

  const linePath = points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
    )
    .join(" ");

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label="Your last 12 quiz scores over time"
      >
        {[0, 25, 50, 75, 100].map((value) => {
          const y =
            top + plotHeight * (1 - value / 100);

          return (
            <g key={value}>
              <line
                x1={left}
                y1={y}
                x2={width - right}
                y2={y}
                stroke="#e2e8f0"
                strokeDasharray="5 5"
              />

              <text
                x={left - 10}
                y={y + 4}
                textAnchor="end"
                fontSize="12"
                fill="#94a3b8"
              >
                {value}%
              </text>
            </g>
          );
        })}

        <path
          d={linePath}
          fill="none"
          stroke="#2563eb"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((point, index) => (
          <g key={index}>
            <circle
              cx={point.x}
              cy={point.y}
              r="6"
              fill="#2563eb"
              stroke="#ffffff"
              strokeWidth="3"
            />

            <title>
              Quiz {index + 1}: {point.score}%
            </title>
          </g>
        ))}

        <text
          x={left}
          y={height - 10}
          fontSize="12"
          fill="#64748b"
        >
          Older quizzes
        </text>

        <text
          x={width - right}
          y={height - 10}
          textAnchor="end"
          fontSize="12"
          fill="#64748b"
        >
          Newer quizzes
        </text>
      </svg>

      <p className="mt-3 text-center text-xs text-slate-400">
        Showing your last {recent.length} completed quizzes
      </p>
    </div>
  );
}

function AchievementCard({
  achievement,
}: {
  achievement: Achievement;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 transition sm:p-5 ${
        achievement.unlocked
          ? "border-amber-200 bg-amber-50"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <div className="mb-4 text-3xl">
        {achievement.unlocked
          ? achievement.icon
          : "🔒"}
      </div>

      <h3
        className={`font-bold ${
          achievement.unlocked
            ? "text-slate-900"
            : "text-slate-500"
        }`}
      >
        {achievement.title}
      </h3>

      <p className="mt-2 text-xs leading-relaxed text-slate-500">
        {achievement.description}
      </p>

      <p
        className={`mt-4 text-xs font-bold ${
          achievement.unlocked
            ? "text-amber-700"
            : "text-slate-400"
        }`}
      >
        {achievement.unlocked
          ? "✓ Unlocked"
          : "Locked"}
      </p>
    </div>
  );
}

export default function ProgressPage() {
  const router = useRouter();

  // NEXATECH_PROGRESS_PREMIUM_V1
  const [compactHeaderProgress, setCompactHeaderProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setCompactHeaderProgress(Math.max(0, Math.min(1, (window.scrollY - 35) / 100)));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      setErrorMessage(error.message);
      return;
    }
    router.replace("/login");
  }


  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarError, setAvatarError] = useState(false);
  const [results, setResults] = useState<QuizResult[]>([]);

  useEffect(() => {
    let active = true;

    async function loadProgress() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (!active) return;

        if (authError || !user) {
          router.replace("/login");
          return;
        }

        setFullName(
          user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            ""
        );

        setAvatarUrl(
          user.user_metadata?.avatar_url || ""
        );

        const allResults: QuizResult[] = [];
        const pageSize = 500;
        let from = 0;

        while (true) {
          const { data, error } = await supabase
            .from("quiz_results")
            .select(
              "id,user_id,subject,score,total_questions,created_at"
            )
            .eq("user_id", user.id)
            .order("created_at", {
              ascending: false,
            })
            .order("id", {
              ascending: false,
            })
            .range(from, from + pageSize - 1);

          if (error) throw error;
          if (!active) return;

          const page = (data ?? []) as QuizResult[];
          allResults.push(...page);

          if (page.length < pageSize) break;
          from += pageSize;
        }

        if (active) setResults(allResults);
      } catch (error) {
        if (active) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load your progress."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProgress();

    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    setAvatarError(false);
  }, [avatarUrl]);

  const stats = useMemo(() => {
    const total = results.length;

    const average = total
      ? Math.round(
          results.reduce(
            (sum, result) =>
              sum + getPercentage(result),
            0
          ) / total
        )
      : 0;

    const best = total
      ? Math.max(...results.map(getPercentage))
      : 0;

    const streaks = getStreaks(results);
    const subjects = getSubjectStats(results);

    const perfectScores = results.filter(
      (result) =>
        result.total_questions > 0 &&
        result.score === result.total_questions
    ).length;

    const achievements: Achievement[] = [
      {
        icon: "🎓",
        title: "First Step",
        description: "Complete your first quiz",
        unlocked: total >= 1,
      },
      {
        icon: "📚",
        title: "Dedicated Learner",
        description: "Complete 10 quizzes",
        unlocked: total >= 10,
      },
      {
        icon: "🏆",
        title: "Quiz Master",
        description: "Complete 25 quizzes",
        unlocked: total >= 25,
      },
      {
        icon: "🔥",
        title: "On Fire",
        description: "Reach a 3-day quiz streak",
        unlocked: streaks.longest >= 3,
      },
      {
        icon: "🌟",
        title: "Perfect Score",
        description: "Get every question correct in a quiz",
        unlocked: perfectScores >= 1,
      },
      {
        icon: "🌍",
        title: "Knowledge Explorer",
        description: "Practice at least 5 subjects",
        unlocked: subjects.length >= 5,
      },
    ];

    return {
      total,
      average,
      best,
      streaks,
      subjects,
      achievements,
      unlocked: achievements.filter(
        (achievement) => achievement.unlocked
      ).length,
    };
  }, [results]);

  const totalXP = calculateTotalXP(results);
  const studentLevel = getStudentLevel(totalXP);

  const firstName =
    fullName.trim().split(/\s+/)[0] || "Student";

  const initials =
    fullName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("") || "S";

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
          <p className="text-sm font-medium text-slate-500">
            Loading your learning journey...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fc] text-slate-900 lg:pl-64">
      {/* Desktop navigation matches the NexaTech dashboard */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-[#101b38] px-5 py-7 text-white lg:flex">
        <Link href="/dashboard" className="mb-12 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-xl font-black">N</span>
          <span>
            <span className="block text-lg font-black">NexaTech</span>
            <span className="block text-[10px] uppercase tracking-widest text-slate-400">Your learning space</span>
          </span>
        </Link>
        <nav aria-label="Desktop navigation" className="space-y-2">
          {[
            { label: "Dashboard", href: "/dashboard", icon: "▦" },
            { label: "Practice Exams", href: "/practice", icon: "✎" },
            { label: "AI Tutor", href: "/ai-tutor", icon: "✦" },
            { label: "My Progress", href: "/progress", icon: "◷" },
            { label: "Leaderboard", href: "/leaderboard", icon: "★" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={item.href === "/progress" ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${item.href === "/progress" ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}
            >
              <span aria-hidden="true" className="w-6 text-center text-xl">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-bold">✦ Learn with confidence</p>
          <p className="mt-2 text-xs leading-5 text-slate-300">Your progress is built one practice session at a time.</p>
        </div>
      </aside>

      {/* One mobile header: full branding blends into a compact centred title on scroll */}
      <header className="sticky top-0 z-[70] border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-xl lg:hidden">
        <div className="relative mx-auto flex h-[72px] max-w-6xl items-center justify-between px-4">
          <Link
            href="/dashboard"
            aria-label="NexaTech dashboard"
            tabIndex={compactHeaderProgress > 0.8 ? -1 : 0}
            className="absolute left-4 flex items-center gap-2.5"
            style={{
              opacity: 1 - compactHeaderProgress,
              transform: `translateY(${-8 * compactHeaderProgress}px)`,
              pointerEvents: compactHeaderProgress > 0.8 ? "none" : "auto",
            }}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-lg font-black text-white">N</span>
            <span className="leading-tight">
              <span className="block text-base font-black tracking-tight">NexaTech</span>
              <span className="block text-[9px] font-bold uppercase tracking-[0.13em] text-slate-400">Student Progress</span>
            </span>
          </Link>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-[82px] flex items-center justify-center gap-2"
            style={{ opacity: compactHeaderProgress, transform: `translateY(${10 * (1 - compactHeaderProgress)}px)` }}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-sm font-black text-white">N</span>
            <span className="min-w-0 leading-tight">
              <span className="block text-sm font-extrabold">NexaTech</span>
              <span className="block text-[10px] font-bold text-blue-600">My Progress</span>
            </span>
          </div>
          <Link
            href="/profile"
            aria-label="Open profile"
            className="absolute left-4 z-10 flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-xs font-black text-blue-700"
            style={{ opacity: compactHeaderProgress, pointerEvents: compactHeaderProgress > 0.8 ? "auto" : "none" }}
            tabIndex={compactHeaderProgress > 0.8 ? 0 : -1}
          >
            {avatarUrl && !avatarError ? (
              <img src={avatarUrl} alt="" onError={() => setAvatarError(true)} className="h-full w-full object-cover" />
            ) : initials}
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/profile"
              aria-label="Open profile"
              className="relative z-10 flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-xs font-black text-blue-700"
              style={{ opacity: 1 - compactHeaderProgress, pointerEvents: compactHeaderProgress > 0.8 ? "none" : "auto" }}
              tabIndex={compactHeaderProgress > 0.8 ? -1 : 0}
            >
              {avatarUrl && !avatarError ? (
                <img src={avatarUrl} alt="" onError={() => setAvatarError(true)} className="h-full w-full object-cover" />
              ) : initials}
            </Link>
            <button type="button" onClick={handleLogout} className="relative z-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
              Log out
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-28 pt-8 sm:px-6 md:pt-10 lg:px-8 lg:pb-12">
        <div className="mb-9">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-bold uppercase tracking-wide text-blue-600">
            📈 Learning Analytics
          </div>

          <h1 className="text-3xl font-black tracking-tight md:text-4xl">
            Your Learning Journey, {firstName}!
          </h1>

          <p className="mt-3 max-w-2xl text-slate-500">
            Understand your performance, celebrate achievements,
            and discover where to focus your learning.
          </p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
          >
            Unable to load progress: {errorMessage}
          </div>
        )}

        {/* PERFORMANCE METRICS */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <MetricCard
            icon="🔥"
            title="Current Quiz Streak"
            value={`${stats.streaks.current} days`}
            description="Consecutive days completing quizzes"
          />

          <MetricCard
            icon="📝"
            title="Quizzes Completed"
            value={stats.total.toString()}
            description="Your total completed quizzes"
          />

          <MetricCard
            icon="🎯"
            title="Average Score"
            value={`${stats.average}%`}
            description="Average across all quizzes"
          />

          <MetricCard
            icon="🏆"
            title="Achievements"
            value={`${stats.unlocked} / ${stats.achievements.length}`}
            description="Badges you've unlocked"
          />
        </div>

        {/* XP AND STUDENT LEVEL */}
        <section className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-[#10244d] via-blue-700 to-blue-600 p-6 text-white shadow-lg md:p-8">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-200">
                NexaTech Learning Rewards
              </p>

              <h2 className="mt-3 text-3xl font-black">
                Level {studentLevel.level}
              </h2>

              <p className="mt-2 text-lg font-semibold text-blue-100">
                🏆 {studentLevel.title}
              </p>
            </div>

            <div className="rounded-2xl bg-white/15 px-6 py-4 backdrop-blur-sm">
              <p className="text-xs font-semibold text-blue-100">
                TOTAL EXPERIENCE POINTS
              </p>

              <p className="mt-2 text-3xl font-black">
                {studentLevel.totalXP.toLocaleString()} XP
              </p>
            </div>
          </div>

          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between gap-2 text-sm font-semibold">
              <span>Level {studentLevel.level}</span>
              <span>Level {studentLevel.level + 1}</span>
            </div>

            <div
              className="h-4 overflow-hidden rounded-full bg-white/20"
              role="progressbar"
              aria-label="Progress to next student level"
              aria-valuenow={studentLevel.progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-amber-300 transition-all duration-500"
                style={{
                  width: `${studentLevel.progress}%`,
                }}
              />
            </div>

            <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-blue-100">
              <span>
                {studentLevel.progress}% complete
              </span>

              <span>
                {studentLevel.xpToNextLevel.toLocaleString()} XP
                until next level
              </span>
            </div>
          </div>

          <div className="mt-7 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-white/10 p-4 text-center">
              <p className="text-2xl">⚡</p>
              <p className="mt-2 text-xl font-black">
                {studentLevel.totalXP.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-blue-100">
                Total XP
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4 text-center">
              <p className="text-2xl">🔥</p>
              <p className="mt-2 text-xl font-black">
                {stats.streaks.current}
              </p>
              <p className="mt-1 text-xs text-blue-100">
                Day Streak
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4 text-center">
              <p className="text-2xl">🎓</p>
              <p className="mt-2 text-xl font-black">
                {studentLevel.level}
              </p>
              <p className="mt-1 text-xs text-blue-100">
                Level
              </p>
            </div>
          </div>
        </section>

        {/* PERFORMANCE CHART */}
        <section className="mb-8 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm md:p-8">
          <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-black">
                Performance Over Time
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Track how your quiz scores change over time.
              </p>
            </div>

            <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
              Best: {stats.best}%
            </span>
          </div>

          <ProgressChart results={results} />
        </section>

        {/* SUBJECT MASTERY */}
        <section className="mb-8 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm md:p-8">
          <div className="mb-7">
            <h2 className="text-xl font-black">
              Subject Mastery
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Your average performance in each subject.
            </p>
          </div>

          {stats.subjects.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-7 text-center text-sm text-slate-500">
              No subject performance data yet.
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {stats.subjects.map((subject) => (
                <div
                  key={subject.name}
                  className="rounded-2xl border border-slate-100 p-5"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-bold">
                        {subject.name}
                      </h3>

                      <p className="mt-1 text-xs text-slate-400">
                        {subject.quizzes} quizzes · Best{" "}
                        {subject.best}%
                      </p>
                    </div>

                    <span className="text-lg font-black text-blue-600">
                      {subject.average}%
                    </span>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all ${
                        subject.average >= 70
                          ? "bg-emerald-500"
                          : subject.average >= 50
                          ? "bg-amber-500"
                          : "bg-red-400"
                      }`}
                      style={{
                        width: `${subject.average}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ACHIEVEMENTS */}
        <section className="mb-8 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm md:p-8">
          <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black">
                Your Achievements
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Unlock badges as you reach new learning milestones.
              </p>
            </div>

            <span className="rounded-full bg-amber-50 px-4 py-2 text-sm font-bold text-amber-700">
              🏅 {stats.unlocked} Unlocked
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
            {stats.achievements.map((achievement) => (
              <AchievementCard
                key={achievement.title}
                achievement={achievement}
              />
            ))}
          </div>
        </section>

        {/* MOTIVATION */}
        <section className="rounded-3xl bg-blue-600 p-7 text-white md:p-9">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-black">
                Keep Growing! 🚀
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-relaxed text-blue-100">
                Every completed quiz adds to your learning
                journey. Keep practicing, build your streak,
                and unlock more achievements.
              </p>
            </div>

            <Link
              href="/practice"
              className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-50"
            >
              Take Another Quiz →
            </Link>
          </div>
        </section>

        <footer className="mt-10 text-center">
          <Link
            href="/dashboard"
            className="text-sm font-bold text-blue-600 hover:text-blue-700"
          >
            ← Back to Dashboard
          </Link>

          <p className="mt-5 text-xs text-slate-400">
            NexaTech · Learn. Practice. Achieve.
          </p>
        </footer>
      </section>
      <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white px-1 pb-[env(safe-area-inset-bottom)] shadow-lg lg:hidden">
        <div className="mx-auto grid max-w-xl grid-cols-5 gap-1">
          {[
            { label: "Dashboard", href: "/dashboard", icon: "▦" },
            { label: "Practice", href: "/practice", icon: "✎" },
            { label: "AI Tutor", href: "/ai-tutor", icon: "✦" },
            { label: "Progress", href: "/progress", icon: "◷" },
            { label: "Ranks", href: "/leaderboard", icon: "★" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={item.href === "/progress" ? "page" : undefined}
              className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-semibold transition sm:text-xs ${item.href === "/progress" ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-50 hover:text-blue-600"}`}
            >
              <span aria-hidden="true" className="text-xl leading-none">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </main>
  );
}
