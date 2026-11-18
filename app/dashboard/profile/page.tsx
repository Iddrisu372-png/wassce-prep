
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [studyGoal, setStudyGoal] = useState("Study 2 hours daily");

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        router.replace("/login");
        return;
      }

      setEmail(user.email ?? "");
      setFullName(
        user.user_metadata?.full_name ??
          user.user_metadata?.name ??
          ""
      );
      setAvatarUrl(user.user_metadata?.avatar_url ?? "");
      setStudyGoal(
        user.user_metadata?.study_goal ?? "Study 2 hours daily"
      );

      setLoading(false);
    }

    loadProfile();
  }, [router]);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: fullName.trim(),
        avatar_url: avatarUrl.trim(),
        study_goal: studyGoal,
      },
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Profile updated successfully!");
    }

    setSaving(false);
  }

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
        <p className="text-sm font-medium text-slate-500">
          Loading your profile...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Navigation */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/dashboard" className="text-xl font-black tracking-tight">
            <span className="text-blue-600">Nexa</span>Tech
          </Link>

          <Link
            href="/dashboard"
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-5 py-10 md:py-14">
        {/* Page heading */}
        <div className="mb-8">
          <p className="mb-2 text-sm font-bold uppercase tracking-wider text-blue-600">
            Account settings
          </p>
          <h1 className="text-3xl font-black tracking-tight md:text-4xl">
            Your student profile
          </h1>
          <p className="mt-3 max-w-xl text-slate-500">
            Manage your personal details and set a study goal to keep yourself
            focused on your WASSCE preparation.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-[260px_1fr]">
          {/* Profile preview */}
          <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile avatar"
                  className="h-24 w-24 rounded-full border-4 border-blue-50 object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-100 text-3xl font-black text-blue-700">
                  {initials}
                </div>
              )}

              <h2 className="mt-4 break-words text-lg font-bold">
                {fullName || "Student"}
              </h2>

              <p className="mt-1 break-all text-sm text-slate-500">
                {email}
              </p>

              <div className="mt-5 w-full rounded-2xl bg-blue-50 p-4 text-left">
                <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
                  Your study goal
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-800">
                  {studyGoal}
                </p>
              </div>
            </div>
          </aside>

          {/* Edit profile */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold">Personal information</h2>
              <p className="mt-1 text-sm text-slate-500">
                Update your details below.
              </p>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label
                  htmlFor="fullName"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Full name
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-500"
                />
                <p className="mt-2 text-xs text-slate-400">
                  Your email is connected to your login account.
                </p>
              </div>

              <div>
                <label
                  htmlFor="avatarUrl"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Profile picture URL
                </label>
                <input
                  id="avatarUrl"
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/my-photo.jpg"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
                <p className="mt-2 text-xs text-slate-400">
                  Add a public image URL. Leave blank to use your initials.
                </p>
              </div>

              <div>
                <label
                  htmlFor="studyGoal"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Daily study goal
                </label>
                <select
                  id="studyGoal"
                  value={studyGoal}
                  onChange={(e) => setStudyGoal(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="Study 30 minutes daily">
                    30 minutes daily
                  </option>
                  <option value="Study 1 hour daily">1 hour daily</option>
                  <option value="Study 2 hours daily">2 hours daily</option>
                  <option value="Study 3 hours daily">3 hours daily</option>
                  <option value="Study 4 hours daily">4 hours daily</option>
                </select>
              </div>

              {message && (
                <div
                  className={`rounded-xl px-4 py-3 text-sm font-medium ${
                    message.includes("successfully")
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-blue-600 px-5 py-3.5 font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving changes..." : "Save changes"}
              </button>
            </form>
          </section>
        </div>
      </section>
    </main>
  );
}
