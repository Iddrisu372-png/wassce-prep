"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase"; 
import { useRouter } from "next/navigation";

export default function PracticePage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  // --- SETUP STATE ---
  const [quizStarted, setQuizStarted] = useState(false);
  const [subject, setSubject] = useState("Mixed"); // Default to Mixed
  const [timeLimit, setTimeLimit] = useState(5); // minutes

  // --- QUIZ STATE ---
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // --- TIMER STATE ---
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setUserEmail(session.user.email || "Student");

      const savedQuiz = localStorage.getItem("activeQuiz");
      if (savedQuiz) {
        const parsed = JSON.parse(savedQuiz);
        if (parsed.timeLeft > 0 && parsed.currentIndex < parsed.questions.length) {
          setQuestions(parsed.questions);
          setCurrentIndex(parsed.currentIndex);
          setScore(parsed.score);
          setTimeLeft(parsed.timeLeft);
          setSelected(parsed.selected || null);
          setQuizStarted(true);
          setLoading(false);
          return; 
        } else {
          localStorage.removeItem("activeQuiz");
        }
      }
      
      setLoading(false);
    }
    init();
  }, [router]);

  useEffect(() => {
    if (quizStarted && currentIndex < questions.length && timeLeft > 0) {
      localStorage.setItem("activeQuiz", JSON.stringify({
        questions, currentIndex, score, timeLeft, selected
      }));
    } else if (quizStarted && currentIndex >= questions.length) {
      localStorage.removeItem("activeQuiz");
    }
  }, [quizStarted, currentIndex, score, timeLeft, questions, selected]);

  useEffect(() => {
    if (timeLeft <= 0 || !quizStarted) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, quizStarted]);

  useEffect(() => {
    if (timeLeft === 0 && quizStarted && currentIndex < questions.length) {
      setCurrentIndex(questions.length); 
    }
  }, [timeLeft, quizStarted, currentIndex, questions.length]);

  const startQuiz = async () => {
    setLoading(true);
    localStorage.removeItem("activeQuiz"); 
    
    let query = supabase.from("questions").select("*");
    
    if (subject !== "Mixed") {
      query = query.eq("subject", subject);
    }

    const { data, error } = await query.limit(50);
      
    if (data && data.length > 0) {
      const shuffled = data.sort(() => 0.5 - Math.random());
      const selectedQuestions = shuffled.slice(0, 5);

      setQuestions(selectedQuestions);
      setTimeLeft(timeLimit * 60); 
      setCurrentIndex(0);
      setScore(0);
      setSelected(null);
      setQuizStarted(true);
    } else {
      alert(`No questions found for ${subject} yet. Please add more questions to your database!`);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    localStorage.removeItem("activeQuiz");
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleNextQuestion = () => {
    setSelected(null); 
    setCurrentIndex((prev) => prev + 1); 
  };

  const saveScore = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.from("quiz_results").insert({
        user_id: session.user.id,
        score: score,
        total_questions: questions.length
      });
    }
  };

  if (loading) return <div className="p-10 text-center font-bold h-screen flex items-center justify-center">Loading...</div>;

  // --- STAGE 1: SETUP SCREEN ---
  if (!quizStarted) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800">
        <nav className="bg-white shadow-sm p-4 flex justify-between items-center px-8">
          <Link href="/" className="font-bold text-xl text-blue-700">WASSCE Prep 🎓</Link>
          <div className="flex gap-4">
            <Link href="/dashboard" className="text-slate-600 font-semibold hover:text-blue-600">Dashboard</Link>
            <button onClick={handleLogout} className="text-red-500 font-semibold hover:text-red-700">Log out</button>
          </div>
        </nav>
        <main className="flex items-center justify-center p-6 mt-16">
          <div className="w-full max-w-xl bg-white p-8 rounded-2xl shadow-xl border-t-8 border-blue-600">
            <h1 className="text-3xl font-extrabold mb-2 text-center">Ready to Practice?</h1>
            <p className="text-slate-500 text-center mb-8">Choose your subject and start your timed mock exam.</p>
            
            <div className="mb-6">
              <label className="block font-bold mb-2">Select Subject</label>
              <select 
                value={subject} 
                onChange={(e) => setSubject(e.target.value)}
                className="w-full p-4 border-2 border-slate-200 rounded-xl focus:border-blue-500 font-semibold bg-slate-50"
              >
                <option value="Mixed">🔥 Mixed (All Subjects)</option>
                
                <optgroup label="Core Subjects">
                  <option value="Mathematics">Mathematics (Core)</option>
                  <option value="English">English Language</option>
                  <option value="Science">Integrated Science</option>
                  <option value="Social Studies">Social Studies</option>
                </optgroup>

                <optgroup label="Elective Subjects">
                  <option value="Elective Math">Elective Mathematics</option>
                  <option value="Biology">Biology</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Physics">Physics</option>
                  <option value="Economics">Economics</option>
                  <option value="Government">Government</option>
                  <option value="Literature">Literature in English</option>
                  <option value="Geography">Geography</option>
                  <option value="ICT">ICT / Computer Science</option>
                </optgroup>
              </select>
            </div>

            <div className="mb-8">
              <label className="block font-bold mb-2">Time Limit</label>
              <select 
                value={timeLimit} 
                onChange={(e) => setTimeLimit(Number(e.target.value))}
                className="w-full p-4 border-2 border-slate-200 rounded-xl focus:border-blue-500 font-semibold bg-slate-50"
              >
                <option value={5}>5 Minutes (Speed Run)</option>
                <option value={10}>10 Minutes (Standard)</option>
                <option value={15}>15 Minutes (Full Exam)</option>
              </select>
            </div>

            <button onClick={startQuiz} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transition-transform hover:-translate-y-1">
              Start Exam 🚀
            </button>
          </div>
        </main>
      </div>
    );
  }

  // --- STAGE 3: RESULTS SCREEN ---
  if (currentIndex >= questions.length) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-2xl bg-white text-slate-800 p-10 rounded-2xl shadow-xl text-center border-t-8 border-blue-600">
            <div className="text-6xl mb-4">{timeLeft === 0 ? "⏰" : "🎉"}</div>
            <h1 className="text-3xl font-extrabold mb-2">
              {timeLeft === 0 ? "Time's Up!" : "Practice Complete!"}
            </h1>
            <p className="text-xl text-slate-600 mb-8">
              You scored <span className="font-bold text-blue-600">{score}</span> out of {questions.length}
            </p>
            <button 
              onClick={async () => {
                await saveScore(); 
                router.push("/dashboard"); 
              }} 
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl w-full mb-4 transition-colors"
            >
              Save Score & View Dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  // --- STAGE 2: ACTIVE QUIZ SCREEN ---
  const currentQuestion = questions[currentIndex];
  const progressPercentage = (currentIndex / questions.length) * 100;
  
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      <nav className="bg-white shadow-sm p-4 flex justify-between items-center px-8">
        <Link href="/" className="font-bold text-xl text-blue-700">WASSCE Prep 🎓</Link>
        <div className="flex items-center gap-4">
          <div className={`px-4 py-2 rounded-lg font-mono font-bold text-lg ${timeLeft < 60 ? "bg-red-100 text-red-600 animate-pulse" : "bg-slate-100 text-slate-700"}`}>
            ⏱ {minutes}:{seconds.toString().padStart(2, '0')}
          </div>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center p-6 mt-4">
        <div className="w-full max-w-3xl">
          
          <div className="mb-8">
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm font-bold text-blue-600 uppercase">{currentQuestion.subject}</span>
              <span className="text-sm font-bold text-slate-500">Question {currentIndex + 1} of {questions.length}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3">
              <div className="bg-blue-600 h-3 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
            </div>
          </div>

          <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-lg border border-slate-100">
            <h2 className="text-2xl font-bold mb-8 leading-snug">{currentQuestion.question}</h2>

            <div className="flex flex-col gap-4 mb-8">
              {currentQuestion.options.map((option: string) => {
                let buttonStyle = "border-slate-200 hover:border-blue-400 hover:bg-slate-50 text-slate-700";
                if (selected === option) {
                  buttonStyle = "border-blue-600 bg-blue-50 text-blue-800 ring-2 ring-blue-200";
                } else if (selected && option === currentQuestion.correct_answer) {
                  buttonStyle = "border-green-500 bg-green-50 text-green-800 ring-2 ring-green-200";
                }
                return (
                  <button
                    key={option}
                    onClick={() => {
                      if (!selected) { 
                        setSelected(option);
                        if (option === currentQuestion.correct_answer) setScore(score + 1);
                      }
                    }}
                    disabled={selected !== null}
                    className={`p-5 text-left border-2 rounded-xl font-semibold text-lg transition-all ${buttonStyle}`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>

            {selected && (
              <div className="mt-8 pt-6 border-t border-slate-100">
                <div className={`p-4 rounded-xl font-bold text-center mb-6 ${selected === currentQuestion.correct_answer ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {selected === currentQuestion.correct_answer ? "Correct! 🎉" : `Incorrect. The answer is ${currentQuestion.correct_answer}.`}
                </div>
                <button onClick={handleNextQuestion} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-colors">
                  Next Question →
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}