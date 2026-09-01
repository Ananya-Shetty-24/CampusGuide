import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Calendar,
  MapPin,
  Clock,
  ChevronDown,
  Sun,
  Moon,
  LayoutDashboard,
  Compass,
  Flag,
  Sparkles,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { getAllBookings, cancelBooking } from "./services/api.js";

const API_BASE = "http://localhost:3001/api";
const THEME_KEY = "campusguide-theme";

function formatDisplayDate(dateStr) {
  const parts = dateStr.split("-").map(Number);
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function isPast(dateStr, endTime) {
  const now = new Date();
  const parts = dateStr.split("-").map(Number);
  const [h, m] = endTime.split(":").map(Number);
  const slotEnd = new Date(parts[0], parts[1] - 1, parts[2], h, m);
  return now > slotEnd;
}

function isToday(dateStr) {
  const today = new Date();
  const parts = dateStr.split("-").map(Number);
  return (
    today.getFullYear() === parts[0] &&
    today.getMonth() === parts[1] - 1 &&
    today.getDate() === parts[2]
  );
}

export default function Bookings() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "light";
    return localStorage.getItem(THEME_KEY) || "light";
  });
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [cancelSuccess, setCancelSuccess] = useState(false);

  function openCancelModal(booking) {
    setCancelTarget(booking);
    setCancelError("");
    setCancelSuccess(false);
  }

  function closeCancelModal() {
    setCancelTarget(null);
    setCancelError("");
    setCancelSuccess(false);
  }

  async function handleConfirmCancel() {
    if (!cancelTarget) return;
    setCancelLoading(true);
    setCancelError("");
    try {
      await cancelBooking(cancelTarget.booking_id);
      setCancelSuccess(true);
      const data = await getAllBookings();
      setBookings(data.bookings || []);
      setTimeout(() => {
        closeCancelModal();
      }, 1500);
    } catch (err) {
      setCancelError(err.message || "Failed to cancel booking.");
    } finally {
      setCancelLoading(false);
    }
  }

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

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await getAllBookings();
        if (!cancelled) setBookings(data.bookings || []);
      } catch (err) {
        if (!cancelled) setError("Couldn't load bookings. Is the backend running?");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const filtered = bookings.filter((b) => {
    if (filter === "upcoming") {
      return !isPast(b.date, b.end_time);
    }
    if (filter === "past") {
      return isPast(b.date, b.end_time);
    }
    return true;
  });

  const upcomingCount = bookings.filter(
    (b) => !isPast(b.date, b.end_time)
  ).length;
  const pastCount = bookings.filter((b) =>
    isPast(b.date, b.end_time)
  ).length;

  const navLinks = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      active: false,
      onClick: () => navigate("/dashboard"),
    },
    {
      label: "Explore Campus",
      icon: Compass,
      active: false,
      onClick: () => navigate("/"),
    },
    {
      label: "Bookings",
      icon: Calendar,
      active: true,
      onClick: () => navigate("/bookings"),
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
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 md:px-8 py-10">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display font-semibold text-3xl mb-2">
              My Bookings
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 text-[15.5px]">
              View and manage your resource reservations.
            </p>
          </div>
          <button
            onClick={() => navigate("/bookings/new")}
            className="shrink-0 px-4 py-2.5 rounded-lg bg-red-500 text-white text-[14px] font-semibold hover:bg-red-600 transition-colors flex items-center gap-1.5"
          >
            <span className="text-lg leading-none">+</span>
            New Booking
          </button>
        </div>

        <div className="flex items-center gap-2 mb-6">
          {[
            { key: "all", label: "All", count: bookings.length },
            { key: "upcoming", label: "Upcoming", count: upcomingCount },
            { key: "past", label: "Past", count: pastCount },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-lg text-[13.5px] font-medium transition-colors ${
                filter === key
                  ? "bg-black dark:bg-white text-white dark:text-black"
                  : "bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600"
              }`}
            >
              {label}
              <span className="ml-1.5 text-[12px] opacity-60">{count}</span>
            </button>
          ))}
        </div>

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 animate-pulse"
              >
                <div className="h-5 w-48 bg-neutral-200 dark:bg-neutral-700 rounded mb-3" />
                <div className="h-4 w-32 bg-neutral-200 dark:bg-neutral-700 rounded mb-2" />
                <div className="h-4 w-40 bg-neutral-200 dark:bg-neutral-700 rounded" />
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-8 text-center">
            <p className="text-neutral-500 dark:text-neutral-400 text-[15px] mb-4">
              {error}
            </p>
            <button
              onClick={() => navigate("/")}
              className="px-5 py-2.5 rounded-lg bg-black dark:bg-white text-white dark:text-black text-[14px] font-semibold hover:opacity-90 transition-opacity"
            >
              Browse Resources
            </button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-8 text-center">
            <Calendar className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
            <p className="text-neutral-500 dark:text-neutral-400 text-[15px] mb-1">
              {bookings.length === 0
                ? "No bookings yet."
                : `No ${filter} bookings.`}
            </p>
            <p className="text-neutral-400 dark:text-neutral-500 text-[13.5px] mb-4">
              {bookings.length === 0
                ? "Find a resource and book a time slot to get started."
                : "Try a different filter."}
            </p>
            {bookings.length === 0 && (
              <button
                onClick={() => navigate("/")}
                className="px-5 py-2.5 rounded-lg bg-red-500 text-white text-[14px] font-semibold hover:bg-red-600 transition-colors"
              >
                Explore Resources
              </button>
            )}
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((booking) => {
              const past = isPast(booking.date, booking.end_time);
              return (
                <div
                  key={booking.booking_id}
                  className={`bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 transition-colors ${
                    past ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <button
                        onClick={() =>
                          navigate(`/resources/${booking.resource_id}`)
                        }
                        className="font-semibold text-[15.5px] text-neutral-900 dark:text-neutral-50 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                      >
                        {booking.resource_name}
                      </button>
                      <div className="flex items-center gap-2 mt-1 text-[13px] text-neutral-500 dark:text-neutral-400">
                        {booking.building && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {booking.building}
                          </span>
                        )}
                        {booking.resource_type && (
                          <>
                            <span className="text-neutral-300 dark:text-neutral-600">
                              ·
                            </span>
                            <span className="capitalize">
                              {booking.resource_type}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium ${
                        past
                          ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-500"
                          : isToday(booking.date)
                          ? "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400"
                          : "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400"
                      }`}
                    >
                      {past ? (
                        <XCircle className="w-3 h-3" />
                      ) : (
                        <CheckCircle className="w-3 h-3" />
                      )}
                      {past
                        ? "Completed"
                        : isToday(booking.date)
                        ? "Today"
                        : "Upcoming"}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13.5px] text-neutral-600 dark:text-neutral-300">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                      {formatDisplayDate(booking.date)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-neutral-400" />
                      {booking.start_time} – {booking.end_time}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-[12px] text-neutral-400 dark:text-neutral-500">
                      <span>Booking {booking.booking_id}</span>
                      {booking.created_at && (
                        <>
                          <span>·</span>
                          <span>
                            Created{" "}
                            {new Date(booking.created_at).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </div>
                    {!past && (
                      <button
                        onClick={() => openCancelModal(booking)}
                        className="px-3 py-1.5 rounded-lg text-[13px] font-medium border border-red-200 dark:border-red-800/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                      >
                        Cancel Booking
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl w-full max-w-md p-6">
            {cancelSuccess ? (
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-500/10 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-7 h-7 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-display font-semibold text-xl text-neutral-900 dark:text-neutral-50 mb-1">
                  Booking Cancelled
                </h3>
                <p className="text-[14px] text-neutral-500 dark:text-neutral-400">
                  Your booking has been cancelled.
                </p>
              </div>
            ) : (
              <>
                <h3 className="font-display font-semibold text-lg text-neutral-900 dark:text-neutral-50 mb-1">
                  Cancel Booking
                </h3>
                <p className="text-[14px] text-neutral-500 dark:text-neutral-400 mb-5">
                  Are you sure you want to cancel this booking? This action cannot be undone.
                </p>

                <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4 mb-5 space-y-2">
                  <div className="font-semibold text-[15px] text-neutral-900 dark:text-neutral-50">
                    {cancelTarget.resource_name}
                  </div>
                  <div className="text-[13.5px] text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDisplayDate(cancelTarget.date)}
                  </div>
                  <div className="text-[13.5px] text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    {cancelTarget.start_time} – {cancelTarget.end_time}
                  </div>
                  <div className="text-[12px] text-neutral-400 dark:text-neutral-500">
                    Booking ID: {cancelTarget.booking_id}
                  </div>
                </div>

                {cancelError && (
                  <div className="text-[13.5px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 mb-4">
                    {cancelError}
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    onClick={closeCancelModal}
                    disabled={cancelLoading}
                    className="px-4 py-2.5 rounded-lg text-[14px] font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
                  >
                    Keep Booking
                  </button>
                  <button
                    onClick={handleConfirmCancel}
                    disabled={cancelLoading}
                    className="px-4 py-2.5 rounded-lg text-[14px] font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    {cancelLoading ? "Cancelling..." : "Yes, Cancel"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
