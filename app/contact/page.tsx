import Link from "next/link";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-8 text-slate-800 flex flex-col items-center">
      <div className="max-w-2xl bg-white p-8 rounded-2xl shadow-lg mt-10 text-center">
        <h1 className="text-3xl font-bold mb-4">Contact Us</h1>
        <p className="mb-8 text-lg text-slate-600">
          Have a question, feedback, or need help with your account? We are here for you.
        </p>
        <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl mb-8">
          <p className="font-bold text-blue-800 mb-2">Email Support</p>
          <a href="mailto:support@yourdomain.com" className="text-xl text-blue-600 underline font-semibold">
            iddris423@gmail.com
          </a>
        </div>
        <Link href="/" className="text-blue-600 font-bold hover:underline block">
          ← Back to Home
        </Link>
      </div>
    </main>
  );
}