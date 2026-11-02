"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DashboardPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchResults() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/login");
        return;
      }
      
      setUserEmail(session.user.email || "Student");

      // Fetch results for this specific user, newest first
      const { data, error } = await supabase
        .from("quiz_results")
        .select("*")
        .order("created_at", { ascending: false });

      if (data) setResults(data);
      setLoading(false);
    }
    fetchResults();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Calculate Stats
  const totalQuizzes = results.length;
  const averageScore = totalQuizzes > 0 
    ? Math.round((results.reduce((acc, curr) => acc + (curr.score / curr.total_questions), 0) / totalQuizzes) * 100) 
    : 0;

  if (loading) return <div className="p-10 text-center text-black h-screen flex items-center justify-center font-bold">Loading dashboard...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 1. TOP NAVIGATION BAR */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="font-bold text-xl text-blue-700">
              WASSCE Prep 🎓
            </Link>
            <div className="flex items-center gap-6 text-sm font-semibold text-slate-600">
              <Link href="/practice" className="hover:text-blue-600 transition-colors">Practice Quiz</Link>
              <Link href="/ai-tutor" className="hover:text-blue-600 transition-colors">AI Tutor</Link>
              <button onClick={handleLogout} className="text-red-500 hover:text-red-700 transition-colors">
                Log out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 2. MAIN CONTENT */}
      <main className="max-w-5xl mx-auto p-6 mt-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-800">Welcome back, Student! 👋</h1>
          <p className="text-slate-500 mt-1">{userEmail}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Card 1: Total Quizzes */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-6">
            <div className="bg-blue-100 text-blue-600 p-4 rounded-xl text-3xl">📝</div>
            <div>
              <p className="text-slate-500 font-semibold text-sm">Total Quizzes Taken</p>
              <p className="text-4xl font-black text-slate-800">{totalQuizzes}</p>
            </div>
          </div>

          {/* Card 2: Average Score */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-6">
            <div className="bg-green-100 text-green-600 p-4 rounded-xl text-3xl">🏆</div>
            <div>
              <p className="text-slate-500 font-semibold text-sm">Average Score</p>
              <p className="text-4xl font-black text-slate-800">{averageScore}%</p>
            </div>
          </div>
        </div>

        {/* 3. RECENT ACTIVITY LIST */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800">Recent Activity</h2>
            
            {/* NOTICE: We are using <a> instead of <Link> here to force a fresh page load */}
            <a href="/practice" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">
              Take New Quiz
            </a>
          </div>

          {results.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              You haven't taken any quizzes yet. <a href="/practice" className="text-blue-600 underline font-semibold">Take one now!</a>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {results.map((result) => {
                const percentage = Math.round((result.score / result.total_questions) * 100);
                const date = new Date(result.created_at).toLocaleDateString("en-GB", {
                  day: "numeric", month: "short", year: "numeric"
                });

                return (
                  <div key={result.id} className="p-6 flex justify-between items-center hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="font-bold text-slate-800 text-lg">
                        Score: {result.score} / {result.total_questions}
                      </p>
                      <p className="text-sm text-slate-500">{date}</p>
                    </div>
                    <div className={`text-xl font-black px-4 py-2 rounded-lg ${
                      percentage >= 50 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {percentage}%
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}