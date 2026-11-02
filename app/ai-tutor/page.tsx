"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function AITutorPage() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    { role: "assistant", content: "Hello! I am your AI Tutor. What subject or question are you struggling with today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true); 
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // FIXED: Tell the login page to come back to the AI Tutor after logging in
        router.push("/login?redirect=/ai-tutor"); 
      } else {
        setCheckingAuth(false); 
      }
    }
    checkUser();
  }, [router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await response.json();
      
      if (data.message) {
        setMessages([...newMessages, data.message]);
      }
    } catch (error) {
      console.error("Error:", error);
    }
    setLoading(false);
  };

  if (checkingAuth) {
    return <div className="h-screen flex items-center justify-center bg-slate-50 text-slate-600 font-bold text-xl">Checking authentication... 🔒</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <nav className="bg-white shadow-sm p-4 flex justify-between items-center px-8 shrink-0">
        <span className="font-bold text-slate-800 text-xl">AI Tutor 🤖</span>
        <Link href="/practice" className="text-blue-600 font-semibold hover:underline">
          Back to Quiz
        </Link>
      </nav>

      <main className="flex-1 overflow-y-auto p-4 sm:p-8 flex flex-col items-center">
        <div className="w-full max-w-3xl flex flex-col gap-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] p-4 rounded-2xl ${
                  msg.role === "user" 
                    ? "bg-blue-600 text-white rounded-br-none" 
                    : "bg-white text-slate-800 border border-slate-200 shadow-sm rounded-bl-none"
                }`}>
                <div className="whitespace-pre-wrap">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white text-slate-500 border border-slate-200 p-4 rounded-2xl rounded-bl-none shadow-sm animate-pulse">
                Tutor is typing...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <div className="bg-white border-t border-slate-200 p-4 shrink-0">
        <form onSubmit={sendMessage} className="max-w-3xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 border-2 border-slate-200 p-4 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-3 px-8 rounded-xl transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}