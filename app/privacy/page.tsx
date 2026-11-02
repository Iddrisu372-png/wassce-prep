import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-8 text-slate-800 flex flex-col items-center">
      <div className="max-w-2xl bg-white p-8 rounded-2xl shadow-lg mt-10">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <p className="text-slate-600 mb-4">We care about your data.</p>
        <Link href="/" className="text-blue-600 font-bold hover:underline">
          ← Back to Home
        </Link>
      </div>
    </main>
  );
}