import React, { useState } from "react";
import { Search } from "lucide-react";

export default function SignUp({ onSubmit, onNavigateToLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      setError("Fill in every field to continue.");
      return;
    }
    if (password.length < 8) {
      setError("Password needs at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setError("");
    setSubmitting(true);
    Promise.resolve(onSubmit ? onSubmit({ name, email, password }) : null).finally(() =>
      setSubmitting(false)
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .font-display { font-family: 'Fraunces', serif; letter-spacing: -0.01em; }
        .font-sans { font-family: 'IBM Plex Sans', sans-serif; }
      `}</style>

      <div className="min-h-screen grid md:grid-cols-2">
        {/* Brand panel */}
        <div className="relative hidden md:flex flex-col justify-between bg-black text-white px-12 py-10 overflow-hidden">
          <a href="/" className="flex items-center gap-2.5 relative z-10">
            <div className="w-7 h-7 rounded-md bg-red-500 flex items-center justify-center">
              <Search className="w-4 h-4 text-black" />
            </div>
            <span className="font-display font-semibold text-xl tracking-tight">
              CampusGuide
            </span>
          </a>

          <div className="relative z-10 max-w-sm">
            <h1 className="font-display font-semibold text-4xl leading-[1.1]">
              Stop refreshing the booking page.
            </h1>
            <p className="text-white/60 text-[15.5px] mt-4 leading-relaxed">
              Create an account to save searches, get notified when a room
              frees up, and book equipment in a couple of taps.
            </p>
          </div>

          <p className="relative z-10 text-white/40 text-sm">
            &copy; {new Date().getFullYear()} CampusGuide
          </p>

          <div
            className="pointer-events-none absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-red-500/20 blur-3xl"
            aria-hidden="true"
          />
        </div>

        {/* Form panel */}
        <div className="flex items-center justify-center px-6 py-16">
          <div className="w-full max-w-sm">
            <div className="md:hidden flex items-center gap-2.5 mb-10">
              <div className="w-7 h-7 rounded-md bg-red-500 flex items-center justify-center">
                <Search className="w-4 h-4 text-black" />
              </div>
              <span className="font-display font-semibold text-xl text-neutral-900 tracking-tight">
                CampusGuide
              </span>
            </div>

            <h2 className="font-display font-semibold text-3xl mb-2">
              Create your account
            </h2>
            <p className="text-neutral-500 text-[15px] mb-8">
              Already have one?{" "}
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="text-red-500 font-medium hover:underline"
              >
                Sign in
              </button>
            </p>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label
                  htmlFor="name"
                  className="block text-[13.5px] font-medium text-neutral-700 mb-1.5"
                >
                  Full name
                </label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Priya Menon"
                  className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-[15px] text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-colors"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-[13.5px] font-medium text-neutral-700 mb-1.5"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@university.edu"
                  className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-[15px] text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-colors"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-[13.5px] font-medium text-neutral-700 mb-1.5"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-[15px] text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-colors"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-[13.5px] font-medium text-neutral-700 mb-1.5"
                >
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-[15px] text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-colors"
                />
              </div>

              {error && <p className="text-[13.5px] text-red-500">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center rounded-lg bg-black text-white font-semibold text-[15px] py-3.5 mt-2 hover:bg-neutral-800 disabled:opacity-60 transition-colors"
              >
                {submitting ? "Creating account…" : "Create account"}
              </button>

              <p className="text-[12.5px] text-neutral-400 text-center pt-1">
                By continuing you agree to CampusGuide's Terms and Privacy
                Policy.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
