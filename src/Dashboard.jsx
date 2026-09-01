import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Search,
  Calendar,
  MapPin,
  ChevronDown,
  ArrowRight,
  Sun,
  Moon,
  X,
  Flag,
  LayoutDashboard,
  Compass,
  Sparkles,
  Send,
  Maximize2,
  Minimize2,
  BookOpen,
} from "lucide-react";

const API_BASE = "http://localhost:3001/api";
const THEME_KEY = "campusguide-theme";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const UPCOMING_BOOKING = {
  resource_name: "AI & ML Laboratory",
  time: "Today · 2:00 PM – 3:00 PM",
  building: "Innovation Building",
};

function SearchResultCard({ result, onSelect }) {
  if (result.type === "resource") {
    return (
      <button
        onClick={onSelect}
        className="w-full text-left rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-3.5 hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors"
      >
        <div className="font-semibold text-[14px] text-neutral-900 dark:text-neutral-50 mb-0.5">
          {result.name}
        </div>
        <div className="text-neutral-500 dark:text-neutral-400 text-[12.5px] capitalize">
          {result.resource_type} &middot; {result.building}
          {result.floor ? `, Floor ${result.floor}` : ""}
        </div>
      </button>
    );
  }

  if (result.type === "equipment") {
    return (
      <button
        onClick={onSelect}
        className="w-full text-left rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-3.5 hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors"
      >
        <div className="font-semibold text-[14px] text-neutral-900 dark:text-neutral-50 mb-0.5">
          {result.name}
        </div>
        <div className="text-neutral-500 dark:text-neutral-400 text-[12.5px]">
          {result.category}
          {result.location ? ` · ${result.location.name}` : ""}
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onSelect}
      className="w-full text-left rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-3.5 hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors"
    >
      <div className="font-semibold text-[14px] text-neutral-900 dark:text-neutral-50 mb-0.5">
        {result.building}
      </div>
      <div className="text-neutral-500 dark:text-neutral-400 text-[12.5px]">
        {result.resources.length} resource
        {result.resources.length === 1 ? "" : "s"}
      </div>
    </button>
  );
}

function ResourceDetailModal({ resourceId, contextLabel, onClose, onBack }) {
  const [resource, setResource] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [resRes, availRes] = await Promise.all([
          fetch(`${API_BASE}/resources/${resourceId}`),
          fetch(`${API_BASE}/resources/${resourceId}/availability`),
        ]);
        if (!resRes.ok) throw new Error(`Request failed (${resRes.status})`);
        if (!availRes.ok) throw new Error(`Request failed (${availRes.status})`);
        const resData = await resRes.json();
        const availData = await availRes.json();
        if (!cancelled) {
          setResource(resData.resource);
          setAvailability(availData.availability || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            "Couldn't load this resource. Make sure the backend is running on http://localhost:3001."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [resourceId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-neutral-900 shadow-2xl border border-neutral-200 dark:border-neutral-700 max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
          {onBack ? (
            <button
              onClick={onBack}
              className="text-[13px] text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
            >
              &larr; Back
            </button>
          ) : (
            <span />
          )}
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-6 h-6 rounded-md flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-5">
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

          {!loading && !error && resource && (
            <>
              {contextLabel && (
                <div className="text-[12.5px] text-red-500 font-medium mb-1">
                  {contextLabel}
                </div>
              )}
              <h3 className="font-display font-semibold text-2xl mb-1">
                {resource.resource_name}
              </h3>
              <div className="text-neutral-500 dark:text-neutral-400 text-[14px] capitalize mb-5">
                {resource.resource_type} &middot; {resource.building}
                {resource.floor ? `, Floor ${resource.floor}` : ""}
                {resource.capacity ? ` · Capacity ${resource.capacity}` : ""}
              </div>

              {resource.equipment?.length > 0 && (
                <div className="mb-5">
                  <div className="text-[13px] font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                    Equipment
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {resource.equipment.map((e) => (
                      <span
                        key={e.equipment_id}
                        className="px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[12.5px] text-neutral-700 dark:text-neutral-300"
                      >
                        {e.equipment_name}
                        {e.quantity > 1 ? ` ×${e.quantity}` : ""}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div className="text-[13px] font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                  Availability
                </div>
                {availability.length === 0 && (
                  <p className="text-neutral-400 text-[13px]">
                    No availability data found.
                  </p>
                )}
                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  {availability.map((a) => (
                    <div
                      key={a.availability_id}
                      className="flex items-center justify-between px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-[13px]"
                    >
                      <span className="text-neutral-600 dark:text-neutral-300">
                        {a.date} &middot; {a.start_time}–{a.end_time}
                      </span>
                      <span
                        className={`text-[12px] font-medium px-2 py-0.5 rounded-full ${
                          a.booked || a.status !== "available"
                            ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-500"
                            : "bg-green-50 dark:bg-green-500/10 text-green-600"
                        }`}
                      >
                        {a.booked ? "Booked" : a.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function LocationResourcesModal({ location, onClose, onSelectResource }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-neutral-900 shadow-2xl border border-neutral-200 dark:border-neutral-700 max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
          <h3 className="font-display font-semibold text-lg">
            {location.building}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-6 h-6 rounded-md flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto p-4 space-y-2">
          {location.resources.map((r) => (
            <button
              key={r.id}
              onClick={() => onSelectResource(r.id)}
              className="w-full text-left rounded-lg border border-neutral-200 dark:border-neutral-700 p-3.5 hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors"
            >
              <div className="font-semibold text-[14px] text-neutral-900 dark:text-neutral-50">
                {r.name}
              </div>
              <div className="text-neutral-500 dark:text-neutral-400 text-[12.5px] capitalize">
                {r.resource_type}
                {r.floor ? `, Floor ${r.floor}` : ""}
                {r.capacity ? ` · Capacity ${r.capacity}` : ""}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
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

  useEffect(() => {
    const root = document.documentElement;
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "dark") root.classList.add("dark");
    else if (saved === "light") root.classList.remove("dark");
    else {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches)
        root.classList.add("dark");
      else root.classList.remove("dark");
    }
  }, []);

  function toggleTheme() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  const [popularResources, setPopularResources] = useState([]);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadResources() {
      try {
        const res = await fetch(`${API_BASE}/resources?limit=6`);
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const data = await res.json();
        if (!cancelled) setPopularResources(data.resources || []);
      } catch (err) {
        if (!cancelled) setLoadError("backend unreachable");
      }
    }
    loadResources();
    return () => {
      cancelled = true;
    };
  }, []);

  const [genieOpen, setGenieOpen] = useState(false);
  const [genieMaximized, setGenieMaximized] = useState(false);
  const [genieInput, setGenieInput] = useState("");
  const [genieMessages, setGenieMessages] = useState([]);
  const [genieLoading, setGenieLoading] = useState(false);
  const [genieConversationId, setGenieConversationId] = useState(null);
  const genieInputRef = useRef(null);

  function openGenie() {
    setGenieOpen(true);
    setGenieMaximized(false);
    setTimeout(() => genieInputRef.current?.focus(), 0);
  }

  function toggleGenieMaximize() {
    setGenieMaximized((prev) => !prev);
  }

  async function handleGenieSubmit(e) {
    e.preventDefault();
    const q = genieInput.trim();
    if (!q) return;

    setGenieMessages((prev) => [...prev, { role: "user", text: q }]);
    setGenieInput("");
    setGenieLoading(true);

    try {
      const res = await fetch(`${API_BASE}/genie`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: q,
          conversationId: genieConversationId,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Request failed (${res.status})`);
      }

      const data = await res.json();
      console.log("Genie response data:", JSON.stringify(data, null, 2));

      const messages = data.messages || [];
      const conversationId = data.conversation_id || data.conversation?.id;
      if (conversationId) {
        setGenieConversationId(conversationId);
      }

      let replyText = "I'm not sure how to respond to that.";
      let results = [];

      const completedMsg = messages.find((m) => m.status === "COMPLETED" && (m.content || (m.attachments && m.attachments.length > 0)));
      if (completedMsg) {
        replyText = completedMsg.content || replyText;

        if (completedMsg.attachments && completedMsg.attachments.length > 0) {
          for (const att of completedMsg.attachments) {
            if (att.text?.content) {
              replyText = att.text.content;
            }
            if (att.suggested_questions) {
              // Skip suggested questions in results
            }
          }
        }
      } else if (messages.length > 0) {
        const lastMsg = messages[messages.length - 1];
        replyText = lastMsg.content || lastMsg.status || replyText;
      }

      setGenieMessages((prev) => [
        ...prev,
        {
          role: "genie",
          text: replyText,
          results,
        },
      ]);
    } catch (err) {
      setGenieMessages((prev) => [
        ...prev,
        {
          role: "genie",
          text: err.message || "Couldn't reach the backend. Make sure it's running on http://localhost:3001.",
          results: [],
        },
      ]);
    } finally {
      setGenieLoading(false);
    }
  }

  const [detailResourceId, setDetailResourceId] = useState(null);
  const [detailContext, setDetailContext] = useState(null);
  const [detailLocation, setDetailLocation] = useState(null);

  function closeDetail() {
    setDetailResourceId(null);
    setDetailContext(null);
    setDetailLocation(null);
  }

  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const inputRef = useRef(null);

  function openSpotlight() {
    setSpotlightOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function closeSpotlight() {
    setSpotlightOpen(false);
    setQuery("");
    setSearchResults([]);
    setSearchError("");
  }

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openSpotlight();
      } else if (e.key === "Escape") {
        closeSpotlight();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!spotlightOpen) return;
    const q = query.trim();
    if (!q) {
      setSearchResults([]);
      setSearchError("");
      setSearching(false);
      return;
    }

    setSearching(true);
    setSearchError("");
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API_BASE}/search?q=${encodeURIComponent(q)}&limit=8`
        );
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const data = await res.json();
        setSearchResults(data.results || []);
      } catch (err) {
        setSearchError(
          "Couldn't reach the backend. Make sure it's running on http://localhost:3001."
        );
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, spotlightOpen]);

  function handleResultSelect(result) {
    closeSpotlight();
    if (result.type === "resource") {
      setDetailContext(null);
      setDetailResourceId(result.id);
    } else if (result.type === "equipment") {
      setDetailContext(`Housing ${result.name}`);
      setDetailResourceId(result.resource_id);
    } else if (result.type === "location") {
      setDetailLocation(result);
    }
  }

  const quickActions = [
    { icon: Search, label: "Find Resource", onClick: openSpotlight },
    { icon: Calendar, label: "My Bookings", onClick: () => navigate("/") },
    { icon: MapPin, label: "Explore Campus", onClick: () => navigate("/") },
  ];

  const navLinks = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      active: true,
      onClick: () => navigate("/dashboard", { state: { name } }),
    },
    {
      label: "Explore Campus",
      icon: Compass,
      active: false,
      onClick: () => navigate("/"),
    },
    {
      label: "Report",
      icon: Flag,
      active: false,
      onClick: () => console.log("TODO: report flow not built yet"),
    },
    {
    label: "Notes",
    icon: BookOpen, // import BookOpen from lucide-react at the top
    active: false,
    onClick: () => navigate("/notes", { state: { name } }),
    },
  ];

  const geniePanelContent = (
    <>
      <div className="flex items-center justify-between px-4 py-3 bg-black dark:bg-neutral-950 text-white shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-red-500" />
          <span className="font-display font-semibold text-[15px]">
            Ask Genie
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleGenieMaximize}
            aria-label={genieMaximized ? "Minimize" : "Maximize"}
            className="w-6 h-6 rounded-md flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10"
          >
            {genieMaximized ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => setGenieOpen(false)}
            aria-label="Close Ask Genie"
            className="w-6 h-6 rounded-md flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        className={`overflow-y-auto p-3 space-y-2.5 ${
          genieMaximized ? "flex-1" : "h-72"
        }`}
      >
        {genieMessages.length === 0 && (
          <p className="text-neutral-400 text-[13px] px-2 py-6 text-center">
            Ask about rooms, equipment, or buildings — e.g. "3D printer"
            or "quiet study room".
          </p>
        )}
        {genieMessages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[85%] rounded-xl rounded-br-sm bg-black dark:bg-red-500 text-white dark:text-neutral-900 text-[13.5px] px-3 py-2">
                {m.text}
              </div>
            </div>
          ) : (
            <div key={i} className="flex justify-start">
              <div className="max-w-[90%] space-y-2">
                <div className="rounded-xl rounded-bl-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 text-[13.5px] px-3 py-2">
                  {m.text}
                </div>
                {m.results?.length > 0 && (
                  <div className="space-y-1.5">
                    {m.results.map((r, j) => (
                      <SearchResultCard
                        key={`${r.type}-${r.id || r.building}-${j}`}
                        result={r}
                        onSelect={() => {
                          setGenieOpen(false);
                          handleResultSelect(r);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        )}
        {genieLoading && (
          <div className="flex justify-start">
            <div className="rounded-xl rounded-bl-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 text-[13.5px] px-3 py-2">
              Thinking…
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={handleGenieSubmit}
        className="flex items-center gap-2 border-t border-neutral-100 dark:border-neutral-800 p-2.5 shrink-0"
      >
        <input
          ref={genieInputRef}
          type="text"
          value={genieInput}
          onChange={(e) => setGenieInput(e.target.value)}
          placeholder="Ask Genie..."
          className="flex-1 min-w-0 bg-transparent text-[13.5px] text-neutral-900 dark:text-neutral-50 placeholder:text-neutral-400 outline-none px-1.5"
        />
        <button
          type="submit"
          disabled={genieLoading}
          className="w-8 h-8 shrink-0 rounded-lg bg-black dark:bg-red-500 text-white dark:text-neutral-900 flex items-center justify-center hover:opacity-90 disabled:opacity-50 transition-opacity"
          aria-label="Send"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </>
  );

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
              onClick={openGenie}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500 text-neutral-900 text-[13px] font-semibold hover:bg-red-600 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Ask Genie
            </button>
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
        <h1 className="font-display font-semibold text-3xl mb-2">
          {getGreeting()}, {name} 👋
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-[15.5px] mb-6">
          Find the right space, equipment, or facility on campus.
        </p>

        <button
          onClick={openSpotlight}
          className="w-full flex items-center gap-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 pl-4 pr-3 py-3 mb-10 text-left hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors"
        >
          <Search className="w-4.5 h-4.5 text-neutral-400 shrink-0" />
          <span className="flex-1 text-[15px] text-neutral-400">
            Search campus resources...
          </span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[11px] font-medium text-neutral-400 border border-neutral-200 dark:border-neutral-700 rounded px-1.5 py-0.5">
            &#8984;K
          </kbd>
        </button>

        <h2 className="font-display font-semibold text-lg mb-3">
          Quick actions
        </h2>
        <div className="grid grid-cols-3 gap-3 mb-10">
          {quickActions.map(({ icon: Icon, label, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              className="flex flex-col items-center justify-center gap-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 py-6 hover:border-neutral-300 dark:hover:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                <Icon className="w-4.5 h-4.5 text-red-500" />
              </div>
              <span className="text-[13.5px] font-medium text-neutral-700 dark:text-neutral-300 text-center leading-tight">
                {label}
              </span>
            </button>
          ))}
        </div>

        <h2 className="font-display font-semibold text-lg mb-3">
          Upcoming booking
        </h2>
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5 mb-10">
          <div className="font-semibold text-[15.5px] mb-1">
            {UPCOMING_BOOKING.resource_name}
          </div>
          <div className="text-neutral-500 dark:text-neutral-400 text-[13.5px]">
            {UPCOMING_BOOKING.time}
          </div>
          <div className="text-neutral-500 dark:text-neutral-400 text-[13.5px] mb-4">
            {UPCOMING_BOOKING.building}
          </div>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1 text-[13.5px] font-semibold text-red-500 hover:underline"
          >
            View booking
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <h2 className="font-display font-semibold text-lg mb-3">
          Popular resources
        </h2>
        <div className="flex flex-wrap gap-2">
          {popularResources.length > 0
            ? popularResources.map((r) => (
                <button
                  key={r.resource_id}
                  onClick={() => navigate("/")}
                  className="px-4 py-2 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-[13.5px] font-medium text-neutral-700 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  {r.resource_name}
                </button>
              ))
            : ["AI Lab", "Seminar Hall", "3D Lab"].map((label) => (
                <button
                  key={label}
                  onClick={() => navigate("/")}
                  className="px-4 py-2 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-[13.5px] font-medium text-neutral-700 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  {label}
                </button>
              ))}
        </div>
        {loadError && (
          <p className="text-[12.5px] text-neutral-400 mt-3">
            Showing placeholder resources — backend isn't reachable at{" "}
            {API_BASE}.
          </p>
        )}
      </main>

      {spotlightOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeSpotlight}
          />
          <div className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-neutral-900 shadow-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-neutral-100 dark:border-neutral-800">
              <Search className="w-5 h-5 text-neutral-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search campus resources..."
                className="flex-1 min-w-0 bg-transparent text-[16px] text-neutral-900 dark:text-neutral-50 placeholder:text-neutral-400 outline-none"
              />
              <button
                onClick={closeSpotlight}
                aria-label="Close search"
                className="w-6 h-6 rounded-md flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto p-3">
              {!query.trim() && (
                <p className="text-neutral-400 text-[13.5px] px-2 py-4 text-center">
                  Start typing to search rooms, equipment, and buildings.
                </p>
              )}

              {query.trim() && searching && (
                <p className="text-neutral-500 dark:text-neutral-400 text-[13.5px] px-2 py-4 text-center">
                  Searching…
                </p>
              )}

              {query.trim() && !searching && searchError && (
                <p className="text-[13.5px] text-red-500 bg-red-50 dark:bg-red-500/10 border border-red-400 rounded-lg px-3 py-2.5 m-1">
                  {searchError}
                </p>
              )}

              {query.trim() &&
                !searching &&
                !searchError &&
                searchResults.length === 0 && (
                  <p className="text-neutral-400 text-[13.5px] px-2 py-4 text-center">
                    No matches for "{query}".
                  </p>
                )}

              {query.trim() &&
                !searching &&
                !searchError &&
                searchResults.length > 0 && (
                  <div className="space-y-2">
                    {searchResults.map((r, i) => (
                      <SearchResultCard
                        key={`${r.type}-${r.id || r.building}-${i}`}
                        result={r}
                        onSelect={() => handleResultSelect(r)}
                      />
                    ))}
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {detailLocation && !detailResourceId && (
        <LocationResourcesModal
          location={detailLocation}
          onClose={closeDetail}
          onSelectResource={(id) => setDetailResourceId(id)}
        />
      )}

      {detailResourceId && (
        <ResourceDetailModal
          resourceId={detailResourceId}
          contextLabel={detailContext}
          onClose={closeDetail}
          onBack={detailLocation ? () => setDetailResourceId(null) : null}
        />
      )}

      {!genieOpen && (
        <button
          onClick={openGenie}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-black dark:bg-red-500 text-white dark:text-neutral-900 pl-4 pr-5 py-3 shadow-xl hover:opacity-90 transition-opacity"
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-[14px] font-semibold">Ask Genie</span>
        </button>
      )}

      {genieOpen && !genieMaximized && (
        <div className="fixed bottom-6 right-6 z-40 w-[22rem] max-w-[calc(100vw-3rem)] rounded-2xl bg-white dark:bg-neutral-900 shadow-2xl border border-neutral-200 dark:border-neutral-700 flex flex-col overflow-hidden">
          {geniePanelContent}
        </div>
      )}

      {genieOpen && genieMaximized && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setGenieOpen(false)}
          />
          <div className="relative w-full max-w-2xl h-[80vh] rounded-2xl bg-white dark:bg-neutral-900 shadow-2xl border border-neutral-200 dark:border-neutral-700 flex flex-col overflow-hidden">
            {geniePanelContent}
          </div>
        </div>
      )}
    </div>
  );
}