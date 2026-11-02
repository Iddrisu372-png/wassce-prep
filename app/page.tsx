"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if the user is logged in when the page loads
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    }
    checkUser();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      
      {/* 1. NAVIGATION BAR */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="flex-shrink-0 flex items-center font-bold text-2xl text-blue-700">
              WASSCE Prep 🎓
            </Link>
            
            {/* SMART BUTTONS: Changes based on whether you are logged in */}
            <div className="flex items-center gap-4">
              {loading ? (
                <span className="text-slate-400 text-sm">Loading...</span>
              ) : user ? (
                <>
                  <Link href="/dashboard" className="text-slate-600 hover:text-blue-600 font-medium">
                    Dashboard
                  </Link>
                  <Link href="/practice" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold transition-colors shadow-md">
                    Continue Studying
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-slate-600 hover:text-blue-600 font-medium">
                    Log in
                  </Link>
                  <Link href="/login" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold transition-colors shadow-md">
                    Sign Up Free
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <main>
        <div className="bg-gradient-to-b from-blue-50 to-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center">
            <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight mb-6">
              Ace Your WASSCE Exams <br className="hidden sm:block" />
              <span className="text-blue-600">With Confidence.</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10">
              Practice real past questions, take timed mock exams, and track your progress. Built for West African students who want to pass with flying colors.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              
              {/* SMART HERO BUTTON */}
              <Link href={user ? "/practice" : "/login"} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
                {user ? "Start New Quiz" : "Start Practicing Free"}
              </Link>
              
              <Link href="#features" className="bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-200 font-bold py-4 px-8 rounded-xl text-lg transition-all">
                How it Works
              </Link>
            </div>
          </div>
        </div>

        {/* 3. FEATURES SECTION */}
        <div id="features" className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Why students love WASSCE Prep</h2>
              <p className="text-slate-600 text-lg">Everything you need to prepare for your exams in one place.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">📚</div>
                <h3 className="text-xl font-bold mb-2">Real Past Questions</h3>
                <p className="text-slate-600">Practice with authentic questions from WAEC, BECE, and JAMB. Filter by subject and year.</p>
              </div>
              
              {/* Feature 2 */}
              <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-xl font-bold mb-2">Performance Tracking</h3>
                <p className="text-slate-600">See your scores, track your progress over time, and know exactly which subjects you need to focus on.</p>
              </div>
              
              {/* Feature 3 */}
              <Link href="/ai-tutor" className="block bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:shadow-md hover:border-blue-300 transition-all">
                <div className="text-4xl mb-4">🤖</div>
                <h3 className="text-xl font-bold mb-2 text-blue-600">AI Tutor</h3>
                <p className="text-slate-600">Stuck on a math problem? Our AI tutor will explain the steps to you like a personal teacher.</p>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* 4. FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-12 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <span className="font-bold text-xl text-white">WASSCE Prep 🎓</span>
            <p className="mt-2 text-sm">Helping West African students succeed.</p>
          </div>
          <div className="flex gap-6 text-sm">
            <Link href="/about" className="hover:text-white transition-colors">About Us</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}