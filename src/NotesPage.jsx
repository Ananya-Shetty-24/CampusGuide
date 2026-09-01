import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  ChevronDown,
  ExternalLink,
  BookOpen,
  Sun,
  Moon,
  LayoutDashboard,
  Compass,
  Flag,
  FolderOpen,
} from "lucide-react";

const API_BASE = "http://localhost:3001/api";
const THEME_KEY = "campusguide-theme";

function NoteCard({ note }) {
  return (
    <a
      href={note.drive_link}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5 hover:border-neutral-300 dark:hover:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
    >
      <div className="w-11 h-11 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center shrink-0">
        <FolderOpen className="w-5 h-5 text-red-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-[15px] text-neutral-900 dark:text-neutral-50">
          {note.semester}
        </div>
        {note.description && (
          <div className="text-neutral-500 dark:text-neutral-400 text-[13px] mt-0.5">
            {note.description}
          </div>
        )}
      </div>
      <ExternalLink className="w-4 h-4 text-neutral-300 dark:text-neutral-600 group-hover:text-red-500 shrink-0 transition-colors" />
    </a>
  );
}

export default function NotesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const name = location.state?.name || "there";

  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "light";
    return localStorage.getItem(THEME_KEY) || "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadNotes() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_BASE}/notes`);
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const data = await res.json();
        if (!cancelled) setNotes(data.notes || []);
      } catch (err) {
        if (!cancelled) {
          setError(
            "Couldn't load notes. Make sure the backend is running on http://localhost:3001."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadNotes();
    return () => {
      cancelled = true;
    };
  }, []);

  const navLinks = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      active: false,
      onClick: () => navigate("/dashboard", { state: { name } }),
    },
    {
      label: "Explore Campus",
      icon: Compass,
      active: false,
      onClick: () => navigate("/"),
    },
    {
      label: "Notes",
      icon: BookOpen,
      active: true,
      onClick: () => navigate("/notes", { state: { name } }),
    },
    {
      label: "Report",
      icon: Flag,
      active: false,
      onClick: () => console.log("TODO: report flow not built yet"),
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 font-sans transition-colors">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .font-display { font-family: 'Fraunces', serif; letter-spacing: -0.01em; }
        .font-sans { font-family: 'IBM Plex Sans', sans-serif; }
      `}</style>

      <header className="bg-black dark:bg-neutral-900 text-white border-b border-transparent dark:border-neutral-800">
        <div className="max-w-5xl mx-auto px-6 md:px-8 h-16 flex items-center justify-between gap-6">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 rounded-md bg-red-500 flex items-center justify-center">
              <Search className="w-4 h-4 text-black" />
            </div>
            <span className="font-display font-semibold text-lg tracking-tight">
              CampusGuide
            </span>
          </div>

          <nav className="hidden sm:flex items-center gap-1 flex-1">
            {navLinks.map(({ label, icon: Icon, active, onClick }) => (
              <button
                key={label}
                onClick={onClick}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13.5px] font-medium transition-colors ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-1.5 text-sm font-medium text-white/90 hover:text-white"
            >
              {name}
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 md:px-8 py-10">
        <h1 className="font-display font-semibold text-3xl mb-2">Notes</h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-[15.5px] mb-8">
          Pick a semester to open its notes on Google Drive.
        </p>

        {loading && (
          <p className="text-neutral-500 dark:text-neutral-400 text-[14px]">
            Loading…
          </p>
        )}

        {!loading && error && (
          <p className="text-[14px] text-red-500 bg-red-50 dark:bg-red-500/10 border border-red-400 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        {!loading && !error && notes.length === 0 && (
          <p className="text-neutral-400 text-[14px]">
            No semesters have been added yet.
          </p>
        )}

        {!loading && !error && notes.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-3">
            {notes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}