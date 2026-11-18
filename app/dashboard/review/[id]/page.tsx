
"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type ReviewQuestion = {
  id: number | string;
  subject?: string;
  question: string;
  options: string[] | Record<string, string>;
  selectedAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
  explanation?: string | null;
};

type QuizResult = {
  id: number | string;
  score: number;
  total_questions: number;
  created_at: string;
  review: ReviewQuestion[] | null;
};

type DisplayOption = {
  key: string;
  value: string;
  index: number;
};

function normalizeAnswer(answer: string | null | undefined) {
  return String(answer ?? "").trim().toLowerCase();
}

function getOptions(options: ReviewQuestion["options"]): DisplayOption[] {
  if (Array.isArray(options)) {
    return options.map((value, index) => ({
      key: String.fromCharCode(65 + index),
      value: String(value),
      index,
    }));
  }

  return Object.entries(options).map(([key, value], index) => ({
    key: String(key),
    value: String(value),
    index,
  }));
}

function answerMatches(
  answer: string | null | undefined,
  options: DisplayOption[],
  option: DisplayOption
) {
  if (answer === null || answer === undefined || answer === "") {
    return false;
  }

  const normalized = normalizeAnswer(answer);
  const normalizedKey = normalizeAnswer(option.key).replace(/[.)]/g, "");

  // Match option key, including keys like "A." or "A)"
  if (normalized === normalizedKey) {
    return true;
  }

  // Match the actual option text
  if (normalized === normalizeAnswer(option.value)) {
    return true;
  }

  // For array options, also support numeric indexes such as "0", "1", "2".
  if (
    Array.isArray(options) &&
    normalized === String(option.index)
  ) {
    return true;
  }

  // Support numeric index values for normalized display options.
  if (normalized === String(option.index)) {
    return true;
  }

  return false;
}

function getAnswerText(
  answer: string | null,
  options: DisplayOption[]
) {
  if (answer === null || answer === undefined || answer === "") {
    return "Not answered";
  }

  const matchedOption = options.find((option) =>
    answerMatches(answer, options, option)
  );

  return matchedOption
    ? `${matchedOption.key}. ${matchedOption.value}`
    : answer;
}

function ReviewExamPageContent() {
  const params = useParams();
  const router = useRouter();
  const resultId = String(params.id);

  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadResult() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          router.replace("/login");
          return;
        }

        const { data, error: resultError } = await supabase
          .from("quiz_results")
          .select("id, score, total_questions, created_at, review")
          .eq("id", resultId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (resultError) {
          throw resultError;
        }

        if (!data) {
          if (isMounted) {
            setError("Exam result not found.");
          }
          return;
        }

        if (isMounted) {
          setResult(data as QuizResult);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not load this exam review."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadResult();

    return () => {
      isMounted = false;
    };
  }, [resultId, router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="font-semibold text-slate-600">
            Loading exam review...
          </p>
        </div>
      </main>
    );
  }

  if (error || !result) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <button
          onClick={() => router.push("/dashboard")}
          className="mb-6 rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold transition hover:bg-slate-100"
        >
          ← Back to Dashboard
        </button>

        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error || "Unable to load this exam."}
        </div>
      </main>
    );
  }

  const percentage =
    result.total_questions > 0
      ? Math.round((result.score / result.total_questions) * 100)
      : 0;

  const review = result.review ?? [];

  const correctCount = review.filter((item) => item.isCorrect).length;
  const incorrectCount = review.filter((item) => !item.isCorrect).length;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-3xl">
        <button
          onClick={() => router.push("/dashboard")}
          className="mb-6 rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold transition hover:bg-slate-100"
        >
          ← Back to Dashboard
        </button>

        {/* EXAM SUMMARY */}
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="mb-2 text-sm font-bold uppercase tracking-wider text-blue-600">
            Practice Results
          </p>

          <h1 className="text-2xl font-extrabold sm:text-3xl">
            Exam Review
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {result.created_at
              ? new Date(result.created_at).toLocaleString()
              : "Date unavailable"}
          </p>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-500">Score</p>
              <p className="mt-1 text-2xl font-extrabold">
                {result.score}/{result.total_questions}
              </p>
            </div>

            <div className="rounded-xl bg-blue-50 p-4">
              <p className="text-sm font-semibold text-blue-700">
                Percentage
              </p>
              <p className="mt-1 text-2xl font-extrabold text-blue-700">
                {percentage}%
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-500">
                Questions
              </p>
              <p className="mt-1 text-2xl font-extrabold">
                {result.total_questions}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-green-200 bg-green-50 p-3">
              <p className="text-sm font-semibold text-green-700">
                Correct answers
              </p>
              <p className="text-xl font-extrabold text-green-700">
                {correctCount}
              </p>
            </div>

            <div className="rounded-xl border border-red-200 bg-red-50 p-3">
              <p className="text-sm font-semibold text-red-700">
                Incorrect answers
              </p>
              <p className="text-xl font-extrabold text-red-700">
                {incorrectCount}
              </p>
            </div>
          </div>
        </section>

        {/* QUESTIONS */}
        {review.length === 0 ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="font-semibold text-slate-700">
              This exam does not have saved review details.
            </p>
          </section>
        ) : (
          <div className="space-y-5">
            {review.map((item, index) => {
              const options = getOptions(item.options);

              return (
                <section
                  key={`${item.id}-${index}`}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-blue-600">
                        QUESTION {index + 1}
                      </p>

                      {item.subject && (
                        <p className="mt-1 text-xs text-slate-500">
                          {item.subject}
                        </p>
                      )}
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-sm font-bold ${
                        item.isCorrect
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {item.isCorrect ? "✓ Correct" : "✕ Incorrect"}
                    </span>
                  </div>

                  <h2 className="mb-5 text-base font-semibold leading-7 text-slate-900">
                    {item.question}
                  </h2>

                  <div className="space-y-2">
                    {options.map((option) => {
                      const selected = answerMatches(
                        item.selectedAnswer,
                        options,
                        option
                      );

                      const correct = answerMatches(
                        item.correctAnswer,
                        options,
                        option
                      );

                      let optionClass =
                        "border-slate-200 bg-white text-slate-700";

                      if (correct) {
                        optionClass =
                          "border-green-500 bg-green-50 text-green-900";
                      } else if (selected) {
                        optionClass =
                          "border-red-500 bg-red-50 text-red-900";
                      }

                      return (
                        <div
                          key={option.key}
                          className={`rounded-xl border p-3.5 ${optionClass}`}
                        >
                          <div className="flex items-start gap-3">
                            <span className="flex h-7 min-w-7 items-center justify-center rounded-lg bg-white/80 text-sm font-bold">
                              {option.key}
                            </span>

                            <div className="flex-1">
                              <p className="text-sm font-medium leading-6">
                                {option.value}
                              </p>

                              <div className="mt-1 flex flex-wrap gap-2">
                                {selected && (
                                  <span className="text-xs font-bold text-red-700">
                                    Your answer
                                  </span>
                                )}

                                {correct && (
                                  <span className="text-xs font-bold text-green-700">
                                    Correct answer
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-5 space-y-3 rounded-xl bg-slate-50 p-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Your answer
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {getAnswerText(item.selectedAnswer, options)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Correct answer
                      </p>
                      <p className="mt-1 text-sm font-semibold text-green-700">
                        {getAnswerText(item.correctAnswer, options)}
                      </p>
                    </div>
                  </div>

                  {item.explanation?.trim() && (
                    <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
                      <p className="text-sm font-bold text-blue-800">
                        Explanation
                      </p>
                      <p className="mt-2 text-sm leading-6 text-blue-900">
                        {item.explanation}
                      </p>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold transition hover:bg-slate-100"
          >
            Back to Dashboard
          </button>

          <button
            onClick={() => router.push("/practice")}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            Practice Again
          </button>
        </div>
      </div>
    </main>
  );
}

export default function ReviewExamPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
          <p className="font-semibold text-slate-600">
            Loading exam review...
          </p>
        </main>
      }
    >
      <ReviewExamPageContent />
    </Suspense>
  );
}
