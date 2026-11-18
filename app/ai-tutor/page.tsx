"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Message = { role: "user" | "assistant"; content: string };
const greeting: Message = {
  role: "assistant",
  content: "Hi! 👋 I'm your NexaTech AI Tutor. Tell me what you're studying, or choose a subject below. I'll help you understand it step by step.",
};
const suggestions = [
  { subject: "Mathematics", prompt: "Teach me how to solve simultaneous equations step by step for WASSCE." },
  { subject: "English", prompt: "Help me improve my WASSCE English essay writing with examples." },
  { subject: "Science", prompt: "Explain photosynthesis for WASSCE Integrated Science with a simple example." },
  { subject: "Social Studies", prompt: "Explain the importance of Ghana's constitution for WASSCE Social Studies." },
];

export default function AITutorPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [messages, setMessages] = useState<Message[]>([greeting]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      if (!session) router.replace("/login?redirect=/ai-tutor");
      else setCheckingAuth(false);
    });
    return () => { active = false; };
  }, [router]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  async function sendMessage(text: string) {
    const prompt = text.trim();
    if (!prompt || loading || prompt.length > 2000) return;
    const next: Message[] = [...messages, { role: "user", content: prompt }];
    setMessages(next);
    setInput("");
    setError("");
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/login?redirect=/ai-tutor"); return; }
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ messages: next.slice(-12) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to reach the tutor.");
      if (data.message?.role !== "assistant" || typeof data.message.content !== "string") {
        throw new Error("The tutor returned an invalid response.");
      }
      setMessages([...next, { role: "assistant", content: data.message.content }]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong. Please retry.");
    } finally {
      setLoading(false);
    }
  }

  if (checkingAuth) return <div className="flex min-h-screen items-center justify-center bg-[#f5f7fc] font-semibold text-slate-600">Preparing your AI Tutor...</div>;

  return (
    <div className="flex h-[100svh] min-h-0 bg-[#f5f7fc] text-slate-900 overflow-hidden">
      <aside className="hidden w-64 shrink-0 flex-col bg-[#101b38] px-5 py-7 text-white lg:flex">
        <Link href="/dashboard" className="flex items-center gap-3 px-2 text-xl font-extrabold tracking-tight">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500">N</span>NexaTech
        </Link>
        <p className="mt-2 px-2 text-xs font-medium text-blue-200/60">YOUR LEARNING SPACE</p>
        <nav className="mt-12 space-y-2 text-sm font-semibold">
          {[
            ["Dashboard", "/dashboard", "▦"],
            ["Practice Exams", "/practice", "✎"],
            ["AI Tutor", "/ai-tutor", "✦"],
            ["My Progress", "/progress", "◷"],
            ["Leaderboard", "/leaderboard", "★"],
          ].map(([label, href, icon]) => (
            <Link key={href} href={href} className={`flex items-center gap-3 rounded-xl px-4 py-3 transition ${href === "/ai-tutor" ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}>
              <span className="w-5 text-center text-lg">{icon}</span>{label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-lg">✨</div>
          <p className="mt-2 text-sm font-bold">Learn with confidence</p>
          <p className="mt-1 text-xs leading-5 text-slate-300">Ask questions, explore explanations, and prepare for WASSCE.</p>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Your personal study assistant</p>
            <h1 className="mt-1 text-xl font-extrabold tracking-tight sm:text-2xl">AI Tutor <span className="text-blue-600">✦</span></h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 lg:hidden">Dashboard</Link>
            <button onClick={() => { setMessages([greeting]); setInput(""); setError(""); }} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200">New chat</button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-7 sm:px-8" aria-label="AI Tutor conversation">
          <div className="mx-auto w-full max-w-3xl">
            {messages.length === 1 && (
              <div className="mb-8 rounded-3xl border border-blue-100 bg-gradient-to-br from-[#eaf2ff] via-white to-[#f4edff] p-6 shadow-sm sm:p-9">
                <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-extrabold text-blue-700 shadow-sm">✦ YOUR STUDY PARTNER</span>
                <h2 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">What would you like to learn today?</h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">Get clear explanations, guided examples, and help with difficult WASSCE topics.</p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {suggestions.map((item) => (
                    <button key={item.subject} disabled={loading} onClick={() => void sendMessage(item.prompt)} className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md disabled:opacity-50">
                      <span className="text-sm font-extrabold text-slate-900">{item.subject}</span>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{item.prompt}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-5" aria-live="polite">
              {messages.map((message, index) => (
                <div key={index} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  {message.role === "assistant" && <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-black text-white">✦</span>}
                  <div className={`max-w-[90%] rounded-2xl px-5 py-4 text-sm leading-7 shadow-sm sm:max-w-[80%] ${message.role === "user" ? "rounded-tr-sm bg-blue-600 text-white" : "rounded-tl-sm border border-slate-200 bg-white text-slate-800"}`}>
                    <div className="prose prose-sm max-w-none break-words [&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-1 [&_li]:ml-4 [&_pre]:overflow-x-auto [&_pre]:whitespace-pre-wrap"><ReactMarkdown>{message.content}</ReactMarkdown></div>
                  </div>
                </div>
              ))}
              {loading && <div className="flex items-center gap-3 text-sm text-slate-500"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">✦</span><span className="rounded-2xl border border-slate-200 bg-white px-5 py-4">Thinking through your question...</span></div>}
              <div ref={endRef} />
            </div>
          </div>
        </main>

        <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-4 sm:px-8">
          <form onSubmit={(event) => { event.preventDefault(); void sendMessage(input); }} className="mx-auto max-w-3xl">
            {error && <p role="alert" className="mb-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error} <button type="button" className="ml-2 font-bold underline" onClick={() => { setInput(messages[messages.length - 1]?.role === "user" ? messages[messages.length - 1].content : input); setError(""); }}>Retry</button></p>}
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-[#f8faff] p-2 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
              <input aria-label="Ask your AI Tutor" value={input} maxLength={2000} onChange={(event) => setInput(event.target.value)} disabled={loading} placeholder="Ask about a subject or question..." className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base outline-none placeholder:text-slate-400" />
              <button type="submit" disabled={loading || !input.trim()} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">Send ↗</button>
            </div>
            <p className="mt-2 text-center text-[11px] text-slate-400">AI can make mistakes. Verify important answers with your teacher or textbook.</p>
          </form>
        </div>
        {/* NEXATECH_MOBILE_NAV_V2 */}
        <nav
          aria-label="Mobile navigation"
          className="shrink-0 border-t border-slate-200 bg-white px-1 pb-[env(safe-area-inset-bottom)] lg:hidden"
        >
          <div className="mx-auto grid max-w-xl grid-cols-5 gap-1">
            {[
              { label: "Home", href: "/dashboard", icon: "⌂" },
              { label: "Practice", href: "/practice", icon: "✎" },
              { label: "AI Tutor", href: "/ai-tutor", icon: "✦" },
              { label: "Progress", href: "/progress", icon: "◷" },
              { label: "Ranks", href: "/leaderboard", icon: "★" },
            ].map((item) => {
              const active = pathname === item.href;

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
                  <span
                    aria-hidden="true"
                    className="text-xl leading-none"
                  >
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
