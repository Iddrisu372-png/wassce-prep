
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Question = {
  id: string | number;
  subject: string;
  question: string;
  options: string[];
};

type ReviewItem = {
  id: string | number;
  subject: string;
  question: string;
  options: string[];
  selectedAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
  explanation?: string | null;
};

type SavedQuiz = {
  userId: string;
  attemptId: string;
  expiresAt: string;
  questions: Question[];
  answers: Record<string, string>;
  markedForReview: string[];
  currentIndex: number;
  examType: string;
  subject: string;
  difficulty: string;
  timeLimit: number;
  questionCount: number;
};


const PREMIUM_CSS = `
/* NEXATECH_PRACTICE_PREMIUM_V3 */
/* NEXATECH_PRACTICE_PREMIUM_V4_SIDEBAR_FIX */
.nexa-practice .nx-desktop-sidebar{display:none}
@media(min-width:1024px){
.nexa-practice .nx-desktop-sidebar{position:fixed;inset:0 auto 0 0;width:256px;z-index:60;display:flex;flex-direction:column;gap:0;padding:28px 20px;background:#101c3b;color:#c6d1e8;overflow-y:auto;box-shadow:6px 0 24px #07132a12}
.nexa-practice .nx-desktop-sidebar nav a{color:#bdc9df;transition:background .2s,color .2s}
.nexa-practice .nx-desktop-sidebar nav a:hover{background:#ffffff12;color:#fff}
.nexa-practice .nx-desktop-sidebar nav a[data-current='true']{background:#175cff;color:#fff;box-shadow:0 8px 22px #175cff35}
.nexa-practice > .nx-glass-nav,.nexa-practice > header,.nexa-practice > main,.nexa-practice > nav:not(.nx-bottom-nav){margin-left:256px}
.nexa-practice > main{max-width:none}
.nexa-practice > main > *{max-width:1280px;margin-left:auto;margin-right:auto}
}

.nexa-practice{--nx-blue:#175cff;--nx-ink:#101b37;background:radial-gradient(ellipse at 85% -10%,#e3edff 0%,transparent 43%),#f4f7fd;color:var(--nx-ink);min-height:100vh}
.nexa-practice .nx-glass-nav{background:rgba(255,255,255,.88);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);border-bottom:1px solid #e5ebf6}
.nexa-practice .nx-brand-mark{background:linear-gradient(145deg,#357bff,#1551ed);box-shadow:0 7px 18px #175cff35;border:1px solid #ffffff44}
.nexa-practice .nx-hero{position:relative;isolation:isolate;overflow:hidden;background:linear-gradient(115deg,#0d1938 0%,#122b67 54%,#185eff 130%);box-shadow:0 25px 55px #0c265128;border:1px solid #ffffff17}
.nexa-practice .nx-hero:before{content:'';position:absolute;z-index:-1;width:390px;height:390px;border-radius:50%;right:-100px;top:-160px;background:radial-gradient(circle,#438aff88,transparent 65%)}
.nexa-practice .nx-hero:after{content:'';position:absolute;z-index:-1;width:300px;height:300px;border:1px solid #ffffff25;border-radius:50%;right:4%;bottom:-215px;box-shadow:0 0 0 50px #ffffff08,0 0 0 100px #ffffff05}
.nexa-practice .nx-hero-kicker{letter-spacing:.16em}
.nexa-practice .nx-panel{background:#fff;border:1px solid #e6ebf5;border-radius:26px;box-shadow:0 8px 32px #1b35650a,0 1px 2px #1b35650b}
.nexa-practice .nx-panel:hover{box-shadow:0 14px 42px #1b356510,0 1px 2px #1b35650b}
.nexa-practice .nx-select{appearance:none;background-color:#f8faff;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364789a' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");background-position:right 14px center;background-repeat:no-repeat;padding-right:38px;border:1px solid #e3eaf6;border-radius:14px;min-height:54px;transition:border-color .2s,box-shadow .2s}
.nexa-practice .nx-select:focus{outline:0;border-color:#5c89ff;box-shadow:0 0 0 4px #2c6cff16}
.nexa-practice .nx-primary{background:linear-gradient(110deg,#175cff,#397aff);box-shadow:0 12px 26px #175cff36;border-radius:16px;transition:transform .2s,box-shadow .2s,filter .2s}
.nexa-practice .nx-primary:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 16px 28px #175cff48;filter:brightness(1.04)}
.nexa-practice .nx-primary:active:not(:disabled){transform:translateY(0)}
.nexa-practice .nx-subject-pill{border:1px solid #e4eafa;border-radius:999px;padding:10px 15px;background:#f8faff;font-size:12px;font-weight:750;color:#526583;transition:all .2s;white-space:nowrap}
.nexa-practice .nx-subject-pill:hover{border-color:#a8bfff;color:#1558ef}
.nexa-practice .nx-subject-pill[data-active='true']{background:#eaf1ff;border-color:#8ab0ff;color:#1558ef;box-shadow:inset 0 0 0 1px #c5d7ff}
.nexa-practice .nx-feature-icon{width:48px;height:48px;display:flex;align-items:center;justify-content:center;border-radius:15px;background:#edf3ff;font-size:23px}
.nexa-practice .nx-answer{transition:transform .2s,border-color .2s,box-shadow .2s,background-color .2s}
.nexa-practice .nx-answer:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 7px 22px #1b356512}
.nexa-practice .nx-progress-track{height:9px;background:#e6ecf7;border-radius:999px;overflow:hidden}
.nexa-practice .nx-progress-fill{height:100%;background:linear-gradient(90deg,#175cff,#57a0ff);border-radius:999px;transition:width .35s}
.nexa-practice .nx-result-ring{background:conic-gradient(#2166ff var(--nx-percent),#e6edff 0);border:0;padding:10px;width:160px;height:160px;border-radius:50%;margin:0 auto;display:flex;align-items:center;justify-content:center}
.nexa-practice .nx-result-ring-inner{background:#fff;width:100%;height:100%;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-direction:column}
.nexa-practice .nx-bottom-nav{display:none}
@media(max-width:767px){.nexa-practice .nx-bottom-nav{display:flex;position:fixed;bottom:0;left:0;right:0;z-index:50;background:#ffffffed;backdrop-filter:blur(16px);border-top:1px solid #e8edf7;justify-content:space-around;padding:9px 6px max(9px,env(safe-area-inset-bottom))}.nexa-practice .nx-bottom-nav a{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;min-width:58px;padding:7px 4px;border-radius:13px;font-size:10px;font-weight:700;color:#71819d}.nexa-practice .nx-bottom-nav a[data-current='true']{background:#edf3ff;color:#175cff}.nexa-practice{padding-bottom:84px}.nexa-practice .nx-hero:after{right:-95px}.nexa-practice .nx-hero{border-radius:24px}.nexa-practice .nx-panel{border-radius:22px}}
@media(prefers-reduced-motion:reduce){.nexa-practice *{transition:none!important;animation:none!important}}
`;

function PracticeBottomNav() {
  const tabs = [
    { href: "/dashboard", icon: "▦", label: "Dashboard" },
    { href: "/practice", icon: "✎", label: "Practice" },
    { href: "/ai-tutor", icon: "✦", label: "AI Tutor" },
    { href: "/progress", icon: "◷", label: "Progress" },
    { href: "/leaderboard", icon: "★", label: "Ranks" },
  ];
  return (
    <nav className="nx-bottom-nav" aria-label="Mobile navigation">
      {tabs.map((tab) => (
        <Link href={tab.href} key={tab.href} data-current={tab.href === "/practice"}>
          <span className="text-lg leading-none" aria-hidden="true">{tab.icon}</span>
          <span>{tab.label}</span>
        </Link>
      ))}
    </nav>
  );
}

function PracticeSidebar() {
  const items = [
    { href: "/dashboard", icon: "▦", label: "Dashboard" },
    { href: "/practice", icon: "✎", label: "Practice Exams" },
    { href: "/ai-tutor", icon: "✦", label: "AI Tutor" },
    { href: "/progress", icon: "◷", label: "My Progress" },
    { href: "/leaderboard", icon: "★", label: "Leaderboard" },
  ];
  return (
    <aside className="nx-desktop-sidebar" aria-label="Main navigation">
      <Link href="/dashboard" className="mb-12 flex items-center gap-3 px-2">
        <span className="nx-brand-mark flex h-11 w-11 items-center justify-center rounded-xl text-xl font-black text-white">N</span>
        <span>
          <span className="block text-lg font-extrabold text-white">NexaTech</span>
          <span className="block text-[10px] font-bold uppercase tracking-wider text-blue-200/70">Your learning space</span>
        </span>
      </Link>
      <nav className="space-y-2">
        {items.map(item => (
          <Link key={item.href} href={item.href} data-current={item.href === "/practice"}
            aria-current={item.href === "/practice" ? "page" : undefined}
            className="flex items-center gap-4 rounded-xl px-4 py-3.5 text-sm font-semibold">
            <span className="w-6 text-center text-xl" aria-hidden="true">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4">
        <span className="text-xl" aria-hidden="true">✦</span>
        <p className="mt-2 text-sm font-bold text-white">Keep improving</p>
        <p className="mt-1 text-xs leading-5 text-blue-100/70">Small practice sessions build big results.</p>
      </div>
    </aside>
  );
}

const STORAGE_KEY = "activeQuiz";

const subjectGroups = [
  {
    label: "Core Subjects",
    options: [
      ["Mathematics", "Mathematics (Core)"],
      ["English", "English Language"],
      ["Science", "Integrated Science"],
      ["Social Studies", "Social Studies"],
    ],
  },
  {
    label: "Elective Subjects",
    options: [
      ["Elective Math", "Elective Mathematics"],
      ["Biology", "Biology"],
      ["Chemistry", "Chemistry"],
      ["Physics", "Physics"],
      ["Economics", "Economics"],
      ["Government", "Government"],
      ["Literature", "Literature in English"],
      ["Geography", "Geography"],
      ["ICT", "ICT / Computer Science"],
    ],
  },
];

function formatTime(seconds: number) {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  const remaining = safe % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remaining
  ).padStart(2, "0")}`;
}

function getSecondsLeft(expiresAt: string) {
  return Math.max(
    0,
    Math.ceil(
      (new Date(expiresAt).getTime() - Date.now()) / 1000
    )
  );
}

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

export default function PracticePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [userId, setUserId] = useState("");
  const [userEmail, setUserEmail] = useState("");

  // Exam settings
  const [examType, setExamType] = useState("WASSCE");
  const [subject, setSubject] = useState("Mixed");
  const [difficulty, setDifficulty] = useState("All");
  const [questionCount, setQuestionCount] = useState(10);
  const [timeLimit, setTimeLimit] = useState(10);

  // Secure session
  const [attemptId, setAttemptId] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [quizStarted, setQuizStarted] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [markedForReview, setMarkedForReview] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [finished, setFinished] = useState(false);

  // Results
  const [score, setScore] = useState(0);
  const [review, setReview] = useState<ReviewItem[]>([]);
  const [resultSubmitted, setResultSubmitted] = useState(false);
  const [submittingResult, setSubmittingResult] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const submittingRef = useRef(false);
  const autoFinalizedRef = useRef("");
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(0);

  // Save answers in order to prevent older choices overwriting newer ones.
  const queueAnswerSave = useCallback(
    (id: string, option: string, quizId: string) => {
      setSavingAnswer(true);
      setSaveError(null);

      saveQueueRef.current = saveQueueRef.current
        .catch(() => undefined)
        .then(async () => {
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (!session) {
            throw new Error("Please log in again.");
          }

          const response = await fetch("/api/practice/save", {
            method: "POST",
            headers: {
              ...authHeaders(session.access_token),
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              attemptId: quizId,
              answers: { [id]: option },
            }),
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.error || "Could not save answer.");
          }

          setSavedCount(Number(result.savedCount || 0));
        })
        .catch((error) => {
          setSaveError(
            error instanceof Error
              ? error.message
              : "Could not save answer."
          );
        })
        .finally(() => {
          setSavingAnswer(false);
        });
    },
    []
  );

  // Load authenticated student and restore valid session.
  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!active) return;

        if (!session) {
          router.replace("/login");
          return;
        }

        setUserId(session.user.id);
        setUserEmail(session.user.email || "Student");

        const saved = localStorage.getItem(STORAGE_KEY);

        if (saved) {
          try {
            const parsed = JSON.parse(saved) as SavedQuiz;

            const valid =
              parsed.userId === session.user.id &&
              typeof parsed.attemptId === "string" &&
              typeof parsed.expiresAt === "string" &&
              Number.isFinite(
                new Date(parsed.expiresAt).getTime()
              ) &&
              Array.isArray(parsed.questions) &&
              parsed.questions.length > 0 &&
              parsed.questions.every(
                (q) =>
                  q &&
                  (typeof q.id === "string" ||
                    typeof q.id === "number") &&
                  typeof q.question === "string" &&
                  Array.isArray(q.options) &&
                  !Object.prototype.hasOwnProperty.call(
                    q,
                    "correct_answer"
                  )
              ) &&
              typeof parsed.currentIndex === "number" &&
              parsed.currentIndex >= 0 &&
              parsed.currentIndex < parsed.questions.length;

            if (valid) {
              setAttemptId(parsed.attemptId);
              setExpiresAt(parsed.expiresAt);
              setQuestions(parsed.questions);
              setAnswers(parsed.answers || {});
              setMarkedForReview(
                parsed.markedForReview || []
              );
              setCurrentIndex(parsed.currentIndex);
              setExamType(parsed.examType || "WASSCE");
              setSubject(parsed.subject || "Mixed");
              setDifficulty(parsed.difficulty || "All");
              setTimeLimit(parsed.timeLimit || 10);
              setQuestionCount(parsed.questionCount || 10);
              setTimeLeft(
                getSecondsLeft(parsed.expiresAt)
              );
              setQuizStarted(true);

              if (
                getSecondsLeft(parsed.expiresAt) === 0
              ) {
                setFinished(true);
              }
            } else {
              localStorage.removeItem(STORAGE_KEY);
            }
          } catch {
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    initialize();

    return () => {
      active = false;
    };
  }, [router]);

  // Save only progress and session identity.
  // Never save an answer key.
  useEffect(() => {
    if (
      !quizStarted ||
      !attemptId ||
      !userId ||
      resultSubmitted
    ) {
      return;
    }

    const saved: SavedQuiz = {
      userId,
      attemptId,
      expiresAt,
      questions,
      answers,
      markedForReview,
      currentIndex: Math.min(
        currentIndex,
        Math.max(0, questions.length - 1)
      ),
      examType,
      subject,
      difficulty,
      timeLimit,
      questionCount,
    };

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(saved)
    );
  }, [
    quizStarted,
    attemptId,
    userId,
    expiresAt,
    questions,
    answers,
    markedForReview,
    currentIndex,
    examType,
    subject,
    difficulty,
    timeLimit,
    questionCount,
    resultSubmitted,
  ]);

  // The deadline comes from the server.
  useEffect(() => {
    if (!quizStarted || !expiresAt || resultSubmitted) {
      return;
    }

    const updateTime = () => {
      const remaining = getSecondsLeft(expiresAt);

      setTimeLeft(remaining);

      if (remaining <= 0) {
        setFinished(true);
      }
    };

    updateTime();

    const timer = window.setInterval(
      updateTime,
      1000
    );

    return () => window.clearInterval(timer);
  }, [quizStarted, expiresAt, resultSubmitted]);

  const startQuiz = async () => {
    if (starting) return;

    setStarting(true);
    setSubmitError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const params = new URLSearchParams({
        examType,
        subject,
        difficulty,
        count: String(questionCount),
        timeLimit: String(timeLimit),
      });

      const response = await fetch(
        `/api/practice?${params.toString()}`,
        {
          method: "GET",
          headers: authHeaders(session.access_token),
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Could not start practice."
        );
      }

      const loadedQuestions: Question[] =
        result.questions || [];

      if (
        loadedQuestions.length === 0 ||
        !result.attemptId ||
        !result.expiresAt
      ) {
        alert(
          "No questions available for these settings."
        );
        return;
      }

      if (loadedQuestions.length < questionCount) {
        alert(
          `Only ${loadedQuestions.length} questions are available for these settings.`
        );
      }

      localStorage.removeItem(STORAGE_KEY);

      setUserId(session.user.id);
      setAttemptId(result.attemptId);
      setExpiresAt(result.expiresAt);
      setQuestions(loadedQuestions);
      setAnswers({});
      setMarkedForReview([]);
      setSavedCount(0);
      setSaveError(null);
      autoFinalizedRef.current = "";
      saveQueueRef.current = Promise.resolve();
      setCurrentIndex(0);
      setScore(0);
      setReview([]);
      setResultSubmitted(false);
      setFinished(false);
      setTimeLeft(
        getSecondsLeft(result.expiresAt)
      );
      setQuizStarted(true);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Could not start practice."
      );
    } finally {
      setStarting(false);
    }
  };

  const logout = async () => {
    localStorage.removeItem(STORAGE_KEY);
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const selectAnswer = (option: string) => {
    if (
      finished ||
      timeLeft <= 0 ||
      Date.now() >= new Date(expiresAt).getTime()
    ) return;

    const question = questions[currentIndex];
    if (!question) return;

    const questionId = String(question.id);

    setAnswers((previous) => ({
      ...previous,
      [questionId]: option,
    }));

    if (attemptId) {
      queueAnswerSave(questionId, option, attemptId);
    }
  };

  const goToQuestion = useCallback(
    (index: number) => {
      if (
        finished ||
        index < 0 ||
        index >= questions.length
      ) {
        return;
      }

      setCurrentIndex(index);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    },
    [finished, questions.length]
  );

  const toggleReview = () => {
    if (finished) return;

    const id = String(
      questions[currentIndex]?.id
    );

    if (!id || id === "undefined") return;

    setMarkedForReview((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );
  };

  const finishExam = () => {
    const unanswered = questions.filter(
      (question) =>
        !answers[String(question.id)]
    ).length;

    const message =
      unanswered > 0
        ? `You have ${unanswered} unanswered questions. Finish anyway?`
        : "Are you sure you want to finish this exam?";

    if (window.confirm(message)) {
      setFinished(true);
    }
  };

  const submitExam = useCallback(
    async (timedOut = false) => {
      if (
        submittingRef.current ||
        resultSubmitted ||
        !attemptId
      ) return;

      submittingRef.current = true;
      setSubmittingResult(true);
      setSubmitError(null);
      setFinished(true);

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.replace("/login");
          return;
        }

        // Wait for previously queued saves.
        await saveQueueRef.current;

        // Before early submission, synchronize all local answers.
        if (
          !timedOut &&
          Date.now() < new Date(expiresAt).getTime()
        ) {
          const saveResponse = await fetch(
            "/api/practice/save",
            {
              method: "POST",
              headers: {
                ...authHeaders(session.access_token),
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                attemptId,
                answers,
              }),
            }
          );

          const saveResult = await saveResponse.json();

          if (!saveResponse.ok) {
            if (Date.now() < new Date(expiresAt).getTime()) {
              throw new Error(
                saveResult.error ||
                "Could not save answers. Please retry."
              );
            }
          } else {
            setSavedCount(Number(saveResult.savedCount || 0));
            setSaveError(null);
          }
        }

        // Finalize only the answers saved on the server.
        const response = await fetch("/api/practice", {
          method: "PATCH",
          headers: {
            ...authHeaders(session.access_token),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ attemptId }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error || "Could not finalize your exam."
          );
        }

        setScore(result.score);
        setReview(result.review || []);
        setResultSubmitted(true);
        setFinished(true);
        setSaveError(null);
        localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        setSubmitError(
          error instanceof Error
            ? error.message
            : "Could not finalize your exam."
        );
      } finally {
        submittingRef.current = false;
        setSubmittingResult(false);
      }
    },
    [attemptId, answers, expiresAt, resultSubmitted, router]
  );

  // Automatically finalize when the server deadline passes.
  useEffect(() => {
    if (
      !quizStarted ||
      !expiresAt ||
      resultSubmitted ||
      submittingRef.current
    ) return;

    if (
      timeLeft === 0 &&
      Date.now() >= new Date(expiresAt).getTime() &&
      autoFinalizedRef.current !== attemptId
    ) {
      autoFinalizedRef.current = attemptId;
      void submitExam(true);
    }
  }, [
    quizStarted,
    expiresAt,
    timeLeft,
    resultSubmitted,
    attemptId,
    submitExam,
  ]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-sm font-medium text-slate-400">
            Preparing your learning space...
          </p>
        </div>
      </div>
    );
  }

  // Practice setup
  if (!quizStarted) {
    return (
      <div className="nexa-practice">
        <style>{PREMIUM_CSS}</style>
        <PracticeSidebar />
        <PracticeBottomNav />
        <nav className="nx-glass-nav nx-setup-topbar">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center nx-brand-mark rounded-xl text-lg font-black text-white">
                N
              </div>
              <div>
                <p className="text-lg font-extrabold">
                  NexaTech
                </p>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-500">
                  Practice Centre
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="hidden rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 sm:inline-flex lg:hidden"
              >
                Dashboard
              </Link>
              <button
                onClick={logout}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:text-red-600"
              >
                Log out
              </button>
            </div>
          </div>
        </nav>

        <main className="mx-auto max-w-7xl px-5 py-6 sm:px-8 sm:py-9">
          <div className="nx-hero mb-6 px-6 py-7 text-white sm:px-9 sm:py-9">
            <div className="max-w-2xl">
              <div className="nx-hero-kicker mb-3 inline-flex rounded-full border border-blue-400/30 bg-blue-400/10 px-4 py-2 text-[11px] font-bold uppercase text-blue-200">
                Practice centre
              </div>

              <h1 className="text-3xl font-black leading-tight sm:text-4xl">
                Make every attempt
                <span className="block text-blue-300">
                  count.
                </span>
              </h1>

              <p className="mt-4 text-sm leading-6 text-slate-300 sm:text-base">
                Build confidence, test your knowledge,
                and prepare for your WASSCE with secure,
                focused practice sessions.
              </p>

              <div className="mt-5 flex flex-wrap gap-2 text-xs">
                {[
                  "Timed practice",
                  "Instant results",
                  "Answer review",
                  "Secure scoring",
                ].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/15 bg-white/10 px-4 py-2 font-semibold backdrop-blur-sm"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_270px]">
            <section className="nx-panel p-5 sm:p-7">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Configure your session
              </p>

              <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">
                Ready to practice?
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Choose your preferences and start
                your secure exam session.
              </p>

              <div className="mt-7">
                <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">Popular subjects</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    ["Mixed", "✦ All subjects"],
                    ["Mathematics", "∑ Mathematics"],
                    ["English", "✎ English"],
                    ["Science", "⚗ Science"],
                    ["Social Studies", "◈ Social Studies"],
                  ].map(([value, label]) => (
                    <button
                      type="button"
                      key={value}
                      onClick={() => setSubject(value)}
                      data-active={subject === value}
                      className="nx-subject-pill"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Exam type
                  </label>
                  <select
                    value={examType}
                    onChange={(e) =>
                      setExamType(e.target.value)
                    }
                    className="nx-select w-full px-4 py-3.5 text-sm font-semibold"
                  >
                    <option value="WASSCE">
                      WASSCE
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Subject
                  </label>
                  <select
                    value={subject}
                    onChange={(e) =>
                      setSubject(e.target.value)
                    }
                    className="nx-select w-full px-4 py-3.5 text-sm font-semibold"
                  >
                    <option value="Mixed">
                      🔥 Mixed — All Subjects
                    </option>

                    {subjectGroups.map((group) => (
                      <optgroup
                        key={group.label}
                        label={group.label}
                      >
                        {group.options.map(
                          ([value, label]) => (
                            <option
                              key={value}
                              value={value}
                            >
                              {label}
                            </option>
                          )
                        )}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Difficulty
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) =>
                      setDifficulty(e.target.value)
                    }
                    className="nx-select w-full px-4 py-3.5 text-sm font-semibold"
                  >
                    <option value="All">
                      All levels
                    </option>
                    <option value="easy">
                      Easy
                    </option>
                    <option value="medium">
                      Medium
                    </option>
                    <option value="hard">
                      Hard
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Number of questions
                  </label>
                  <select
                    value={questionCount}
                    onChange={(e) =>
                      setQuestionCount(
                        Number(e.target.value)
                      )
                    }
                    className="nx-select w-full px-4 py-3.5 text-sm font-semibold"
                  >
                    {[5, 10, 20, 30, 50].map(
                      (count) => (
                        <option
                          key={count}
                          value={count}
                        >
                          {count} Questions
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Time limit
                  </label>
                  <select
                    value={timeLimit}
                    onChange={(e) =>
                      setTimeLimit(
                        Number(e.target.value)
                      )
                    }
                    className="nx-select w-full px-4 py-3.5 text-sm font-semibold"
                  >
                    <option value={5}>
                      5 minutes — Speed practice
                    </option>
                    <option value={10}>
                      10 minutes — Standard
                    </option>
                    <option value={15}>
                      15 minutes — Focused practice
                    </option>
                    <option value={30}>
                      30 minutes — Extended practice
                    </option>
                    <option value={60}>
                      60 minutes — Full session
                    </option>
                  </select>
                </div>
              </div>

              <button
                onClick={startQuiz}
                disabled={starting}
                className="nx-primary mt-8 w-full px-6 py-4 text-base font-extrabold text-white disabled:opacity-60"
              >
                {starting
                  ? "Creating secure exam..."
                  : "Start Practice →"}
              </button>
            </section>

            <aside className="space-y-5">
              <div className="nx-panel p-6">
                <div className="text-3xl">
                  🎯
                </div>
                <h3 className="mt-4 text-lg font-extrabold">
                  Stay focused
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Challenge yourself with timed
                  questions and track your improvement.
                </p>
              </div>

              <div className="nx-panel p-6">
                <p className="text-xs font-bold uppercase text-slate-400">
                  Your session
                </p>

                <div className="mt-5 space-y-4">
                  {[
                    ["Questions", String(questionCount)],
                    ["Time", `${timeLimit} min`],
                    ["Subject", subject],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex justify-between gap-3 text-sm"
                    >
                      <span className="text-slate-500">
                        {label}
                      </span>
                      <span className="font-extrabold">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="nx-panel bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
                <p className="text-sm font-extrabold text-blue-900">
                  Keep going,{" "}
                  {userEmail.split("@")[0] ||
                    "Student"}!
                </p>
                <p className="mt-2 text-sm leading-6 text-blue-800/80">
                  Every completed practice session
                  brings you closer to your goals.
                </p>
              </div>
            </aside>
          </div>
        </main>
      </div>
    );
  }

  const answeredCount = questions.filter(
    (question) =>
      Boolean(answers[String(question.id)])
  ).length;

  const unansweredCount =
    questions.length - answeredCount;

  // Finished exam and results — NexaTech Phase 5
  if (finished) {
    const total = questions.length;
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
    const correctCount = resultSubmitted ? review.filter((item) => item.isCorrect).length : 0;
    const incorrectCount = resultSubmitted ? review.filter((item) => !item.isCorrect && Boolean(item.selectedAnswer)).length : 0;
    const missedCount = resultSubmitted ? review.filter((item) => !item.selectedAnswer).length : unansweredCount;
    const performanceTitle = percentage >= 80 ? "Excellent work!" : percentage >= 60 ? "Great progress!" : percentage >= 40 ? "Keep building momentum!" : "Every attempt helps you grow!";

    return (
      <div className="nexa-practice">
        <style>{PREMIUM_CSS}</style>
        <PracticeSidebar />
        <PracticeBottomNav />
        <header className="nx-glass-nav">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="nx-brand-mark flex h-10 w-10 items-center justify-center rounded-xl text-lg font-black text-white">N</span>
              <div><p className="text-sm font-extrabold leading-tight">NexaTech</p><p className="text-xs font-semibold text-slate-500">Exam results</p></div>
            </div>
            <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">Session summary</span>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-10">
          <section className="nx-panel overflow-hidden">
            <div className="bg-gradient-to-br from-[#101d41] via-[#173c88] to-[#256bff] px-6 py-9 text-center text-white sm:px-10 sm:py-12">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-3xl shadow-lg" aria-hidden="true">{timeLeft === 0 ? "⏰" : "🏆"}</div>
              <p className="text-xs font-extrabold uppercase tracking-[.2em] text-blue-200">{timeLeft === 0 ? "Time is up" : "Session completed"}</p>
              <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{resultSubmitted ? performanceTitle : "Ready to see your results?"}</h1>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-blue-100 sm:text-base">{resultSubmitted ? `You answered ${score} out of ${total} questions correctly. Review your attempt below and keep improving.` : "Review your session summary before submitting your answers for secure marking."}</p>
              {resultSubmitted && (
                <div className="mx-auto mt-7 flex h-44 w-44 items-center justify-center rounded-full p-[10px] shadow-2xl" style={{ background: `conic-gradient(#93c5fd ${Math.max(0,Math.min(100,percentage))}%,rgba(255,255,255,.2) 0)` }} role="img" aria-label={`Your score is ${percentage} percent`}>
                  <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-[#142e69]">
                    <span className="text-5xl font-black tabular-nums">{percentage}%</span><span className="mt-1 text-xs font-bold uppercase tracking-wider text-blue-200">Your score</span>
                  </div>
                </div>
              )}
            </div>
            <div className="p-5 sm:p-8">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {(resultSubmitted ? [
                  { label: "Correct", value: correctCount, icon: "✓", tone: "text-emerald-700 bg-emerald-50 border-emerald-100" },
                  { label: "Incorrect", value: incorrectCount, icon: "✕", tone: "text-rose-700 bg-rose-50 border-rose-100" },
                  { label: "Unanswered", value: missedCount, icon: "—", tone: "text-amber-700 bg-amber-50 border-amber-100" },
                  { label: "Total questions", value: total, icon: "#", tone: "text-blue-700 bg-blue-50 border-blue-100" },
                ] : [
                  { label: "Answered", value: answeredCount, icon: "✓", tone: "text-emerald-700 bg-emerald-50 border-emerald-100" },
                  { label: "Unanswered", value: unansweredCount, icon: "—", tone: "text-amber-700 bg-amber-50 border-amber-100" },
                  { label: "Marked for review", value: markedForReview.length, icon: "☆", tone: "text-violet-700 bg-violet-50 border-violet-100" },
                  { label: "Total questions", value: total, icon: "#", tone: "text-blue-700 bg-blue-50 border-blue-100" },
                ]).map((stat) => (
                  <div key={stat.label} className={`rounded-2xl border p-4 sm:p-5 ${stat.tone}`}>
                    <div className="flex items-center justify-between gap-2"><span className="text-xs font-bold">{stat.label}</span><span className="text-xl font-black" aria-hidden="true">{stat.icon}</span></div>
                    <p className="mt-3 text-3xl font-black tabular-nums">{stat.value}</p>
                  </div>
                ))}
              </div>
              {submitError && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{submitError}</p>}
              {!resultSubmitted ? (
                <div className="mt-7 flex flex-col gap-3">
                  {timeLeft > 0 && <button onClick={() => setFinished(false)} className="rounded-xl border border-slate-200 px-5 py-3.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50">← Return to exam</button>}
                  {timeLeft > 0 && markedForReview.length > 0 && <button onClick={() => { const index = questions.findIndex((question) => markedForReview.includes(String(question.id))); if (index >= 0) { setCurrentIndex(index); setFinished(false); } }} className="rounded-xl border border-violet-200 bg-violet-50 px-5 py-3.5 text-sm font-bold text-violet-700">☆ Review marked questions</button>}
                  <button onClick={() => void submitExam(timeLeft <= 0)} disabled={submittingResult} className="nx-primary px-5 py-4 text-sm font-extrabold text-white disabled:opacity-60">{submittingResult ? "Checking your answers..." : "Submit Exam & See Results →"}</button>
                </div>
              ) : (
                <button onClick={() => {
                  localStorage.removeItem(STORAGE_KEY);
                  setQuizStarted(false); setFinished(false); setResultSubmitted(false);
                  setQuestions([]); setAnswers({}); setMarkedForReview([]);
                  setCurrentIndex(0); setAttemptId(""); setExpiresAt("");
                  setTimeLeft(0); setScore(0); setReview([]);
                  setSubmitError(null); setSaveError(null); setSavedCount(0);
                  autoFinalizedRef.current = "";
                  saveQueueRef.current = Promise.resolve();
                  router.push("/dashboard");
                }} className="nx-primary mt-7 w-full px-5 py-4 text-sm font-extrabold text-white">View Dashboard →</button>
              )}
            </div>
          </section>
          {resultSubmitted && (
            <section className="mt-10" aria-labelledby="nx-exam-review-heading">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                <div><p className="text-xs font-extrabold uppercase tracking-widest text-blue-600">Learn from your attempt</p><h2 id="nx-exam-review-heading" className="mt-2 text-2xl font-black sm:text-3xl">Exam review</h2><p className="mt-2 text-sm text-slate-500">See your answers, the correct options and available explanations.</p></div>
                <span className="rounded-full bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm">{review.length} questions reviewed</span>
              </div>
              <div className="space-y-5">
                {review.map((item, index) => {
                  const skipped = !item.selectedAnswer;
                  const status = item.isCorrect ? "Correct" : skipped ? "Unanswered" : "Incorrect";
                  const badgeStyle = item.isCorrect ? "bg-emerald-100 text-emerald-800" : skipped ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800";
                  return (
                    <article key={`${String(item.id)}-${index}`} className="nx-panel overflow-hidden">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-7">
                        <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Question {index + 1} · {item.subject}</span>
                        <span className={`rounded-full px-3 py-1.5 text-xs font-extrabold ${badgeStyle}`}>{item.isCorrect ? "✓" : skipped ? "—" : "✕"} {status}</span>
                      </div>
                      <div className="p-5 sm:p-7">
                        <h3 className="text-base font-extrabold leading-7 text-slate-900 sm:text-lg">{item.question}</h3>
                        <div className="mt-5 space-y-3">
                          {item.options.map((option, optionIndex) => {
                            const correct = option.trim() === item.correctAnswer.trim();
                            const chosen = option.trim() === (item.selectedAnswer || "").trim();
                            const tone = correct ? "border-emerald-300 bg-emerald-50 text-emerald-900" : chosen ? "border-rose-300 bg-rose-50 text-rose-900" : "border-slate-200 bg-white text-slate-700";
                            return <div key={optionIndex} className={`flex items-start justify-between gap-3 rounded-2xl border p-4 ${tone}`}>
                              <div className="flex min-w-0 items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/80 text-xs font-black">{String.fromCharCode(65 + optionIndex)}</span><span className="pt-1 text-sm font-semibold leading-6">{option}</span></div>
                              {(correct || chosen) && <span className="shrink-0 text-right text-xs font-extrabold">{correct ? "✓ Correct" : "Your answer"}</span>}
                            </div>;
                          })}
                        </div>
                        {skipped && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-800">You did not answer this question.</p>}
                        {item.explanation && <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-5"><p className="text-xs font-extrabold uppercase tracking-wider text-blue-700">💡 Explanation</p><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-blue-950">{item.explanation}</p></div>}
                      </div>
                    </article>
                  );
                })}
                {review.length === 0 && <div className="nx-panel p-6 text-sm text-slate-600">Detailed review is not available for this attempt.</div>}
              </div>
            </section>
          )}
        </main>
      </div>
    );
  }

  // Active exam
  const currentQuestion = questions[currentIndex];
  const selected =
    answers[String(currentQuestion.id)] || null;

  const isMarked = markedForReview.includes(
    String(currentQuestion.id)
  );

  const progressPercentage =
    ((currentIndex + 1) / questions.length) * 100;

  const isLastQuestion =
    currentIndex === questions.length - 1;

  return (
    <div className="nexa-practice">
        <style>{PREMIUM_CSS}</style>
        <PracticeSidebar />
        <PracticeBottomNav />
      <header className="nx-glass-nav sticky top-0 z-20">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center nx-brand-mark rounded-xl font-black text-white">
              N
            </div>
            <div>
              <p className="text-sm font-extrabold">
                NexaTech
              </p>
              <p className="text-xs text-slate-500">
                WASSCE Prep
              </p>
            </div>
          </Link>

          <div
            className={`rounded-xl px-4 py-2.5 font-mono text-base font-extrabold ${
              timeLeft < 60
                ? "bg-red-50 text-red-600"
                : "bg-slate-100 text-slate-800"
            }`}
          >
            ⏱ {formatTime(timeLeft)}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-7 sm:px-8 sm:py-10">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
              {examType} Practice
            </p>
            <h1 className="mt-1 text-2xl font-black">
              Exam session
            </h1>
          </div>

          <span className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold">
            {currentIndex + 1} /{" "}
            {questions.length}
          </span>
        </div>

        <div className="nx-progress-track mb-8">
          <div
            className="nx-progress-fill"
            style={{
              width: `${progressPercentage}%`,
            }}
          />
        </div>

        <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="nx-panel p-6 sm:p-9">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-extrabold uppercase text-blue-700">
                {currentQuestion.subject}
              </span>

              {isMarked && (
                <span className="rounded-full bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700">
                  ★ Marked for review
                </span>
              )}
            </div>

            <p className="mt-7 text-xs font-bold uppercase text-slate-400">
              Question {currentIndex + 1}
            </p>

            <h2 className="mt-3 text-xl font-extrabold leading-8 sm:text-2xl">
              {currentQuestion.question}
            </h2>

            <div className="mt-8 space-y-3">
              {currentQuestion.options.map(
                (option, index) => {
                  const isSelected =
                    selected === option;

                  return (
                    <button
                      key={`${index}-${option}`}
                      type="button"
                      onClick={() =>
                        selectAnswer(option)
                      }
                      className={`nx-answer flex w-full items-start gap-4 rounded-2xl border-2 p-4 text-left sm:p-5 ${
                        isSelected
                          ? "border-blue-600 bg-blue-50"
                          : "border-slate-200 bg-white hover:border-blue-300"
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold ${
                          isSelected
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {String.fromCharCode(
                          65 + index
                        )}
                      </span>

                      <span className="pt-1 text-sm font-semibold leading-6">
                        {option}
                      </span>

                      {isSelected && (
                        <span className="ml-auto text-blue-600">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                }
              )}
            </div>

            {selected && (
              <div className="mt-5 rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
                {savingAnswer
                  ? "Saving answer to server..."
                  : saveError
                  ? `Answer not saved: ${saveError}`
                  : `Server has saved ${savedCount} answer(s). You can change your choice before submitting.`}
              </div>
            )}

            <button
              onClick={toggleReview}
              className={`mt-6 w-full rounded-xl border px-4 py-3.5 text-sm font-extrabold ${
                isMarked
                  ? "border-purple-200 bg-purple-50 text-purple-700"
                  : "border-slate-200 text-slate-600"
              }`}
            >
              {isMarked
                ? "★ Remove Review Mark"
                : "☆ Mark this question for review"}
            </button>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() =>
                  goToQuestion(currentIndex - 1)
                }
                disabled={currentIndex === 0}
                className="flex-1 rounded-xl border border-slate-200 px-5 py-3.5 text-sm font-extrabold disabled:opacity-40"
              >
                ← Previous
              </button>

              <button
                onClick={() => {
                  if (isLastQuestion) {
                    finishExam();
                  } else {
                    goToQuestion(
                      currentIndex + 1
                    );
                  }
                }}
                disabled={!selected}
                className="nx-primary flex-1 px-5 py-3.5 text-sm font-extrabold text-white disabled:opacity-40"
              >
                {isLastQuestion
                  ? "Finish Exam →"
                  : "Next Question →"}
              </button>
            </div>
          </section>

          <aside className="space-y-5">
            <section className="nx-panel p-6">
              <h2 className="text-base font-extrabold">
                Question navigator
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Jump to any question in your exam.
              </p>

              <div className="mt-5 grid grid-cols-5 gap-2">
                {questions.map(
                  (question, index) => {
                    const isCurrent =
                      index === currentIndex;

                    const isAnswered = Boolean(
                      answers[String(question.id)]
                    );

                    const marked =
                      markedForReview.includes(
                        String(question.id)
                      );

                    let style =
                      "border-slate-200 bg-slate-100 text-slate-700";

                    if (marked) {
                      style =
                        "border-purple-300 bg-purple-100 text-purple-800";
                    } else if (isAnswered) {
                      style =
                        "border-green-300 bg-green-100 text-green-800";
                    }

                    if (isCurrent) {
                      style =
                        "border-blue-600 bg-blue-600 text-white";
                    }

                    return (
                      <button
                        key={String(question.id)}
                        onClick={() =>
                          goToQuestion(index)
                        }
                        className={`h-10 rounded-xl border text-xs font-extrabold ${style}`}
                      >
                        {index + 1}
                      </button>
                    );
                  }
                )}
              </div>

              <div className="mt-5 space-y-3 rounded-2xl bg-slate-50 p-4 text-sm">
                <div className="flex justify-between">
                  <span>Answered</span>
                  <strong>{answeredCount}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Remaining</span>
                  <strong>{unansweredCount}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Marked</span>
                  <strong>
                    {markedForReview.length}
                  </strong>
                </div>
              </div>

              <button
                onClick={finishExam}
                className="mt-5 w-full rounded-xl bg-slate-950 px-4 py-3.5 text-sm font-extrabold text-white"
              >
                Finish Exam
              </button>
            </section>

            <section className="nx-panel bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
              <div className="text-2xl">💡</div>
              <h3 className="mt-4 text-sm font-extrabold text-blue-900">
                Exam tip
              </h3>
              <p className="mt-2 text-sm leading-6 text-blue-900/70">
                If you are unsure about an answer,
                mark it for review and return
                before submitting.
              </p>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
