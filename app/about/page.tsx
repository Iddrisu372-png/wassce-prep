import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-8 text-slate-800 flex flex-col items-center">
      <div className="max-w-2xl bg-white p-8 rounded-2xl shadow-lg mt-10">
        <h1 className="text-3xl font-bold mb-4">About WASSCE Prep</h1>
        <p className="mb-4 text-lg">
          WASSCE Prep was built to help West African students pass their exams with confidence. 
          We believe that every student deserves access to high-quality practice questions and personalized tutoring, regardless of where they live.
        </p>
        <p className="mb-8 text-lg">
          Our platform combines real past questions with artificial intelligence to give you a study experience that adapts to your needs.
        </p>
        <Link href="/" className="text-blue-600 font-bold hover:underline">
          ← Back to Home
        </Link>
      </div>
    </main>
  );
}