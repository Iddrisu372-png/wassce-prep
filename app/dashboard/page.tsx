
"use client";

import { useEffect, useState } from "react";
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
  score: number;
  total_questions: number;
  subject: string;
  created_at: string;
};

type SubjectPerformance = {
  subject: string;
  quizzes: number;
  average: number;
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

function ProfileAvatar({
  avatarUrl,
  initials,
  size,
}: {
  avatarUrl: string;
  initials: string;
  size: "small" | "large";
}) {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [avatarUrl]);

  const dimensions =
    size === "large"
      ? "h-16 w-16 text-xl"
      : "h-9 w-9 text-xs";

  if (avatarUrl && !imageError) {
    return (
      <img
        src={avatarUrl}
        alt="Student profile picture"
        onError={() => setImageError(true)}
        className={`${dimensions} shrink-0 rounded-full border-2 border-white object-cover shadow-sm`}
      />
    );
  }

  return (
    <div
      className={`${dimensions} flex shrink-0 items-center justify-center rounded-full bg-blue-100 font-black text-blue-700`}
    >
      {initials}
    </div>
  );
}

function StatCard({
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
    <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
        {icon}
      </div>

      <p className="text-sm font-medium text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-3xl font-black text-slate-900">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-400">
        {description}
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();

  // NEXATECH_WHATSAPP_HEADER_V6
  const [compactHeaderProgress, setCompactHeaderProgress] =
    useState(0);

  useEffect(() => {
    let frame = 0;

    const updateHeader = () => {
      cancelAnimationFrame(frame);

      frame = requestAnimationFrame(() => {
        const y = window.scrollY;
        const progress = Math.max(
          0,
          Math.min(1, (y - 35) / 100)
        );

        setCompactHeaderProgress(progress);
      });
    };

    updateHeader();

    window.addEventListener("scroll", updateHeader, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", updateHeader);
      cancelAnimationFrame(frame);
    };
  }, []);


  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [results, setResults] = useState<QuizResult[]>([]);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
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
              "id,user_id,score,total_questions,subject,created_at"
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

        if (active) {
          setResults(allResults);
        }
      } catch (error) {
        if (active) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Something went wrong while loading your dashboard."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, [router]);

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.replace("/login");
  }

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

  const totalQuizzes = results.length;

  const totalXP = calculateTotalXP(results);
  const studentLevel = getStudentLevel(totalXP);

  const averageScore = totalQuizzes
    ? Math.round(
        results.reduce(
          (sum, result) =>
            sum + getPercentage(result),
          0
        ) / totalQuizzes
      )
    : 0;

  const bestScore = totalQuizzes
    ? Math.max(...results.map(getPercentage))
    : 0;

  const subjectPerformance = Object.values(
    results.reduce<Record<string, SubjectPerformance>>(
      (acc, result) => {
        const subject = result.subject || "Other";

        if (!acc[subject]) {
          acc[subject] = {
            subject,
            quizzes: 0,
            average: 0,
          };
        }

        acc[subject].average += getPercentage(result);
        acc[subject].quizzes++;

        return acc;
      },
      {}
    )
  )
    .map((subject) => ({
      ...subject,
      average: Math.round(
        subject.average / subject.quizzes
      ),
    }))
    .sort((a, b) => b.average - a.average);

  function formatDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Unknown date";
    }

    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

          <p className="text-sm font-medium text-slate-500">
            Loading your dashboard...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fc] text-slate-900 lg:pl-64">

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-[#101b38] px-5 py-7 text-white lg:flex">
        <Link href="/" className="mb-12 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-xl font-black">
            N
          </span>
          <span>
            <span className="block text-lg font-black">NexaTech</span>
            <span className="block text-[10px] uppercase tracking-widest text-slate-400">
              Your learning space
            </span>
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
              aria-current={item.href === "/dashboard" ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                item.href === "/dashboard"
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span aria-hidden="true" className="w-6 text-center text-xl">
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-bold">✦ Keep improving</p>
          <p className="mt-2 text-xs leading-5 text-slate-300">
            Practice regularly and track your progress toward WASSCE success.
          </p>
        </div>
      </aside>
      {/* NEXATECH_SINGLE_MOBILE_HEADER_V9: one sticky bar, two title states */}
      <header className="sticky top-0 z-[70] border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-xl lg:hidden">
        <div className="relative mx-auto flex h-[72px] max-w-6xl items-center justify-between px-4">
          {/* Full-size branding: fades away within this same header */}
          <Link
            href="/"
            aria-label="NexaTech home"
            tabIndex={compactHeaderProgress > 0.8 ? -1 : 0}
            className="absolute left-4 flex items-center gap-2.5"
            style={{
              opacity: 1 - compactHeaderProgress,
              transform: `translateY(${-8 * compactHeaderProgress}px)`,
              pointerEvents: compactHeaderProgress > 0.8 ? "none" : "auto",
            }}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-lg font-black text-white shadow-sm">N</span>
            <span className="leading-tight">
              <span className="block text-base font-black tracking-tight text-slate-900">NexaTech</span>
              <span className="block text-[9px] font-bold uppercase tracking-[0.13em] text-slate-400">Student Dashboard</span>
            </span>
          </Link>

          {/* Compact centred branding: smoothly appears as the user scrolls */}
          <div
            aria-hidden={compactHeaderProgress < 0.95}
            className="pointer-events-none absolute inset-x-[82px] flex items-center justify-center gap-2"
            style={{
              opacity: compactHeaderProgress,
              transform: `translateY(${10 * (1 - compactHeaderProgress)}px)`,
            }}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-sm font-black text-white">N</span>
            <span className="min-w-0 leading-tight">
              <span className="block text-sm font-extrabold tracking-tight text-slate-900">NexaTech</span>
              <span className="block text-[10px] font-bold text-blue-600">Dashboard</span>
            </span>
          </div>

          {/* Profile shifts from the right to the left without adding a second bar */}
          <Link
            href="/profile"
            aria-label="Open profile"
            title="Profile"
            className="absolute left-4 z-10 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
            style={{
              opacity: compactHeaderProgress,
              pointerEvents: compactHeaderProgress > 0.8 ? "auto" : "none",
            }}
            tabIndex={compactHeaderProgress > 0.8 ? 0 : -1}
          >
            <ProfileAvatar avatarUrl={avatarUrl} initials={initials} size="small" />
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/profile"
              aria-label="Open profile"
              className="relative z-10 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
              style={{
                opacity: 1 - compactHeaderProgress,
                pointerEvents: compactHeaderProgress > 0.8 ? "none" : "auto",
              }}
              tabIndex={compactHeaderProgress > 0.8 ? -1 : 0}
            >
              <ProfileAvatar avatarUrl={avatarUrl} initials={initials} size="small" />
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="relative z-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-28 pt-8 md:px-8 md:pt-12 lg:pb-12">
        {errorMessage && (
          <div
            role="alert"
            className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
          >
            {errorMessage}
          </div>
        )}

        {/* WELCOME SECTION */}
        <div className="mb-9 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <ProfileAvatar
              avatarUrl={avatarUrl}
              initials={initials}
              size="large"
            />

            <div>
              <h1 className="text-3xl font-black tracking-tight md:text-4xl">
                Welcome back, {firstName}! 👋
              </h1>

              <p className="mt-2 text-sm text-slate-500 md:text-base">
                Ready to take your learning to the next level?
              </p>
            </div>
          </div>

          <Link
            href="/practice"
            className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700"
          >
            + Take a Quiz
          </Link>
        </div>

        {/* DASHBOARD STATISTICS */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            icon="📝"
            title="Quizzes Completed"
            value={totalQuizzes.toString()}
            description="Total completed quizzes"
          />

          <StatCard
            icon="🎯"
            title="Average Score"
            value={`${averageScore}%`}
            description="Your overall quiz average"
          />

          <StatCard
            icon="🏆"
            title="Best Score"
            value={`${bestScore}%`}
            description="Your highest quiz result"
          />

          <StatCard
            icon="⚡"
            title="Learning Level"
            value={`Level ${studentLevel.level}`}
            description={`${studentLevel.totalXP.toLocaleString()} XP · ${studentLevel.title}`}
          />
        </div>

        {/* XP PROGRESS */}
        <section className="mb-8 rounded-3xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Your Learning Rank
              </p>

              <h2 className="mt-2 text-xl font-black text-slate-900">
                🏆 {studentLevel.title}
              </h2>
            </div>

            <Link
              href="/progress"
              className="text-sm font-bold text-blue-600 hover:text-blue-700"
            >
              View XP Details →
            </Link>
          </div>

          <div className="mb-2 flex items-center justify-between gap-3 text-xs font-bold text-slate-600">
            <span>
              Level {studentLevel.level}
            </span>

            <span>
              {studentLevel.xpToNextLevel.toLocaleString()} XP
              to next level
            </span>
          </div>

          <div
            className="h-3 overflow-hidden rounded-full bg-blue-100"
            role="progressbar"
            aria-label="Progress to next student level"
            aria-valuenow={studentLevel.progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-500"
              style={{
                width: `${studentLevel.progress}%`,
              }}
            />
          </div>
        </section>

        {/* SUBJECT PERFORMANCE */}
        <div className="mb-8 grid gap-8 lg:grid-cols-3">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black">
                  Subject Performance
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Track your strengths across subjects.
                </p>
              </div>

              <Link
                href="/progress"
                className="text-sm font-bold text-blue-600 hover:text-blue-700"
              >
                Detailed Analytics →
              </Link>
            </div>

            {subjectPerformance.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-500">
                Complete a quiz to see your subject performance.
              </div>
            ) : (
              <div className="space-y-6">
                {subjectPerformance.map((subject) => (
                  <div key={subject.subject}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold">
                          {subject.subject}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {subject.quizzes} completed quizzes
                        </p>
                      </div>

                      <span className="font-black text-blue-600">
                        {subject.average}%
                      </span>
                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${
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

          {/* MOTIVATION CARD */}
          <section className="flex flex-col justify-between rounded-3xl bg-blue-600 p-7 text-white">
            <div>
              <div className="mb-5 text-4xl">
                🚀
              </div>

              <h2 className="text-2xl font-black">
                Your Progress Matters!
              </h2>

              <p className="mt-4 text-sm leading-relaxed text-blue-100">
                Track your study streaks, unlock achievement
                badges, earn XP, and discover how your scores
                improve over time.
              </p>
            </div>

            <Link
              href="/progress"
              className="mt-8 inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-700 hover:bg-blue-50"
            >
              View My Progress →
            </Link>
          </section>
        </div>

        {/* QUIZ HISTORY */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black">
                Recent Quiz History
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Review your completed quizzes and results.
              </p>
            </div>

            <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600">
              {totalQuizzes} Total
            </span>
          </div>

          {results.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-8 text-center">
              <p className="font-semibold text-slate-700">
                No quizzes completed yet.
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Start practicing to build your learning history.
              </p>

              <Link
                href="/practice"
                className="mt-5 inline-block rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white"
              >
                Start Your First Quiz
              </Link>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                      <th className="pb-4 font-bold">
                        Subject
                      </th>

                      <th className="pb-4 font-bold">
                        Score
                      </th>

                      <th className="pb-4 font-bold">
                        Percentage
                      </th>

                      <th className="pb-4 font-bold">
                        Date
                      </th>

                      <th className="pb-4 text-right font-bold">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {results.slice(0, 10).map((result) => (
                      <tr
                        key={result.id}
                        className="border-b border-slate-50 last:border-0"
                      >
                        <td className="py-4 font-semibold">
                          {result.subject || "Other"}
                        </td>

                        <td className="py-4 text-slate-600">
                          {result.score} / {result.total_questions}
                        </td>

                        <td className="py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              getPercentage(result) >= 70
                                ? "bg-emerald-50 text-emerald-700"
                                : getPercentage(result) >= 50
                                ? "bg-amber-50 text-amber-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {getPercentage(result)}%
                          </span>
                        </td>

                        <td className="py-4 text-slate-500">
                          {formatDate(result.created_at)}
                        </td>

                        <td className="py-4 text-right">
                          <Link
                            href={`/dashboard/review/${result.id}`}
                            className="font-bold text-blue-600 hover:text-blue-700"
                          >
                            Review →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE QUIZ HISTORY */}
              <div className="space-y-3 md:hidden">
                {results.slice(0, 10).map((result) => (
                  <div
                    key={result.id}
                    className="rounded-2xl border border-slate-100 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold">
                          {result.subject || "Other"}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {formatDate(result.created_at)}
                        </p>
                      </div>

                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                        {getPercentage(result)}%
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-sm text-slate-500">
                        {result.score} / {result.total_questions}
                      </p>

                      <Link
                        href={`/dashboard/review/${result.id}`}
                        className="text-sm font-bold text-blue-600"
                      >
                        Review →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {results.length > 10 && (
                <p className="mt-5 text-center text-xs text-slate-400">
                  Showing your 10 most recent quizzes.
                </p>
              )}
            </>
          )}
        </section>

        <footer className="mt-10 text-center text-xs text-slate-400">
          NexaTech · Learn. Practice. Achieve.
        </footer>
      </section>

      <nav
        /* NEXATECH_MOBILE_NAV_CLEANUP_V7 */
aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white px-1 pb-[env(safe-area-inset-bottom)] shadow-lg lg:hidden"
      >
        <div className="mx-auto grid max-w-xl grid-cols-5 gap-1">
          {[
            { label: "Dashboard", href: "/dashboard", icon: "⌂" },
            { label: "Practice", href: "/practice", icon: "✎" },
            { label: "AI Tutor", href: "/ai-tutor", icon: "✦" },
            { label: "Progress", href: "/progress", icon: "◷" },
            { label: "Ranks", href: "/leaderboard", icon: "★" },
          ].map((item) => {
            const active = item.href === "/dashboard";

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-semibold transition sm:text-xs ${
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-500 hover:bg-slate-50 hover:text-blue-600"
                }`}
              >
                <span aria-hidden="true" className="text-xl leading-none">
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </main>
  );
}
