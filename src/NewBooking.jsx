import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Calendar, Clock, MapPin, Users, ChevronDown,
  Sun, Moon, LayoutDashboard, Compass, Flag, X, Check,
  ChevronLeft, ArrowLeft, Loader2
} from "lucide-react";
import { createBooking } from "./services/api.js";

const API_BASE = "http://localhost:3001/api";
const THEME_KEY = "campusguide-theme";

const RESOURCE_TYPES = ["All", "Laboratory", "Classroom", "Study Room", "Study Space", "Special Facility"];

const EQUIPMENT_OPTIONS = [
  "Camera", "Microphone", "Green Screen", "Projector", "Smart Board",
  "Whiteboard", "3D Printer", "Laser Cutter", "Monitor", "Display",
  "Video Conferencing", "Audio System", "Editing PC", "CAD Workstation"
];

const TIME_SLOTS = [
  { label: "09:00 – 11:00", start: "09:00", end: "11:00" },
  { label: "11:00 – 13:00", start: "11:00", end: "13:00" },
  { label: "14:00 – 16:00", start: "14:00", end: "16:00" },
  { label: "16:00 – 18:00", start: "16:00", end: "18:00" },
];

function formatDisplayDate(dateStr) {
  const parts = dateStr.split("-").map(Number);
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function getTodayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function NewBooking() {
  const navigate = useNavigate();

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

  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [minCapacity, setMinCapacity] = useState("");
  const [selectedEquipment, setSelectedEquipment] = useState([]);
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchError, setSearchError] = useState("");

  const [bookingSlot, setBookingSlot] = useState(null);
  const [bookingResource, setBookingResource] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(null);

  function toggleEquipment(eq) {
    setSelectedEquipment((prev) =>
      prev.includes(eq) ? prev.filter((e) => e !== eq) : [...prev, eq]
    );
  }

  async function handleSearch(e) {
    e.preventDefault();
    setSearching(true);
    setSearched(true);
    setSearchError("");
    setResults([]);

    try {
      let url = `${API_BASE}/resources?limit=50`;
      if (selectedType !== "All") {
        url += `&type=${encodeURIComponent(selectedType)}`;
      }

      const resRes = await fetch(url);
      if (!resRes.ok) throw new Error("Failed to fetch resources");
      const resData = await resRes.json();
      let resources = resData.resources || [];

      if (minCapacity && parseInt(minCapacity, 10) > 0) {
        resources = resources.filter((r) => r.capacity >= parseInt(minCapacity, 10));
      }

      const enriched = [];

      for (const r of resources) {
        try {
          const detailRes = await fetch(`${API_BASE}/resources/${r.resource_id}`);
          if (!detailRes.ok) continue;
          const detailData = await detailRes.json();
          const fullResource = detailData.resource;

          if (selectedEquipment.length > 0) {
            const resourceEqNames = (fullResource.equipment || []).map(
              (eq) => eq.equipment_name.toLowerCase()
            );
            const hasAny = selectedEquipment.some((eq) =>
              resourceEqNames.includes(eq.toLowerCase())
            );
            if (!hasAny) continue;
          }

          const availRes = await fetch(
            `${API_BASE}/resources/${r.resource_id}/availability?date=${selectedDate}`
          );
          if (!availRes.ok) continue;
          const availData = await availRes.json();
          const slots = availData.availability || [];

          let matchingSlot = null;
          if (selectedTimeSlot) {
            const ts = TIME_SLOTS.find((t) => t.label === selectedTimeSlot);
            if (ts) {
              matchingSlot = slots.find(
                (s) =>
                  s.start_time === ts.start &&
                  s.end_time === ts.end &&
                  s.status === "Available" &&
                  !s.booked
              );
            }
          } else {
            matchingSlot = slots.find(
              (s) => s.status === "Available" && !s.booked
            );
          }

          if (matchingSlot) {
            enriched.push({
              ...fullResource,
              equipment_list: fullResource.equipment || [],
              matchingSlot,
              allSlots: slots,
            });
          }
        } catch (err) {
          continue;
        }
      }

      enriched.sort((a, b) => a.resource_name.localeCompare(b.resource_name));
      setResults(enriched);
    } catch (err) {
      setSearchError("Something went wrong. Please try again.");
    } finally {
      setSearching(false);
    }
  }

  function openBookingModal(resource) {
    setBookingResource(resource);
    setBookingSlot(resource.matchingSlot);
    setBookingError(null);
    setBookingSuccess(null);
  }

  async function handleConfirmBooking() {
    if (!bookingResource || !bookingSlot) return;
    setBookingLoading(true);
    setBookingError(null);

    try {
      const result = await createBooking(
        bookingResource.resource_id,
        bookingSlot.availability_id
      );
      setBookingSuccess(result.booking);
      setBookingSlot(null);
      setBookingResource(null);

      setResults((prev) =>
        prev.map((r) => {
          if (r.resource_id === bookingResource.resource_id) {
            return {
              ...r,
              matchingSlot: null,
              allSlots: r.allSlots.map((s) =>
                s.availability_id === bookingSlot.availability_id
                  ? { ...s, booked: true, status: "Booked" }
                  : s
              ),
            };
          }
          return r;
        }).filter((r) => r.matchingSlot !== null)
      );
    } catch (err) {
      if (err.message && err.message.includes("no longer available")) {
        setBookingError("This time slot is no longer available. Someone else booked it first.");
        if (bookingResource && bookingSlot) {
          try {
            const refreshRes = await fetch(
              `${API_BASE}/resources/${bookingResource.resource_id}/availability?date=${selectedDate}`
            );
            if (refreshRes.ok) {
              const refreshData = await refreshRes.json();
              const newSlots = refreshData.availability || [];
              const stillAvailable = newSlots.find(
                (s) => s.availability_id === bookingSlot.availability_id && !s.booked
              );
              if (!stillAvailable) {
                setResults((prev) =>
                  prev.filter((r) => r.resource_id !== bookingResource.resource_id)
                );
                setBookingSlot(null);
                setBookingResource(null);
              }
            }
          } catch (e) {}
        }
      } else {
        setBookingError(err.message || "Booking failed. Please try again.");
      }
    } finally {
      setBookingLoading(false);
    }
  }

  const navLinks = [
    { label: "Dashboard", icon: LayoutDashboard, onClick: () => navigate("/dashboard") },
    { label: "Explore Campus", icon: Compass, onClick: () => navigate("/") },
    { label: "Bookings", icon: Calendar, onClick: () => navigate("/bookings"), active: true },
    { label: "Report", icon: Flag, onClick: () => console.log("TODO") },
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
            <span className="font-display font-semibold text-lg tracking-tight">CampusGuide</span>
          </div>
          <nav className="hidden sm:flex items-center gap-1 flex-1">
            {navLinks.map(({ label, icon: Icon, onClick, active }) => (
              <button
                key={label}
                onClick={onClick}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13.5px] font-medium transition-colors ${
                  active ? "bg-white/10 text-white" : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-3 shrink-0">
            <button onClick={toggleTheme} aria-label="Toggle dark mode"
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 md:px-8 py-8">
        <button onClick={() => navigate("/bookings")}
          className="inline-flex items-center gap-1.5 text-[13.5px] text-neutral-500 hover:text-red-500 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to My Bookings
        </button>

        <h1 className="font-display font-semibold text-[36px] md:text-[40px] leading-tight mb-2">
          New Booking
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-[15.5px] mb-8">
          Find and reserve an available campus resource.
        </p>

        <form onSubmit={handleSearch} className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div>
              <label className="block text-[13.5px] font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                min={getTodayStr()}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-[14px] text-neutral-900 dark:text-neutral-50 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900/30 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[13.5px] font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Time Slot
              </label>
              <div className="relative">
                <select
                  value={selectedTimeSlot}
                  onChange={(e) => setSelectedTimeSlot(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-[14px] text-neutral-900 dark:text-neutral-50 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900/30 transition-colors pr-10"
                >
                  <option value="">Any available slot</option>
                  {TIME_SLOTS.map((ts) => (
                    <option key={ts.label} value={ts.label}>{ts.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[13.5px] font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Resource Type
              </label>
              <div className="relative">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-[14px] text-neutral-900 dark:text-neutral-50 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900/30 transition-colors pr-10"
                >
                  {RESOURCE_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[13.5px] font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Minimum Capacity
              </label>
              <input
                type="number"
                min="1"
                value={minCapacity}
                onChange={(e) => setMinCapacity(e.target.value)}
                placeholder="e.g. 10"
                className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-[14px] text-neutral-900 dark:text-neutral-50 placeholder:text-neutral-400 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900/30 transition-colors"
              />
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-[13.5px] font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Required Equipment
            </label>
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT_OPTIONS.map((eq) => (
                <button
                  key={eq}
                  type="button"
                  onClick={() => toggleEquipment(eq)}
                  className={`px-3 py-1.5 rounded-lg text-[13px] font-medium border transition-colors ${
                    selectedEquipment.includes(eq)
                      ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400"
                      : "bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-600"
                  }`}
                >
                  {selectedEquipment.includes(eq) && <span className="mr-1">✓</span>}
                  {eq}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={searching}
            className="w-full md:w-auto px-6 py-2.5 rounded-lg bg-red-500 text-white text-[14px] font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {searching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Find Available Resources
              </>
            )}
          </button>
        </form>

        {searchError && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-800 rounded-xl p-5 mb-6">
            <p className="text-[14px] text-red-600 dark:text-red-400">{searchError}</p>
          </div>
        )}

        {searched && !searching && results.length === 0 && !searchError && (
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-8 text-center">
            <Search className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
            <p className="text-neutral-600 dark:text-neutral-300 text-[15px] mb-1">
              No available resources match your requirements.
            </p>
            <p className="text-neutral-400 dark:text-neutral-500 text-[13.5px] mb-4">
              Try adjusting your filters or selecting a different date/time.
            </p>
            <button
              onClick={() => { setSearched(false); setResults([]); }}
              className="px-5 py-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-[14px] font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            >
              Change Search
            </button>
          </div>
        )}

        {!searching && results.length > 0 && (
          <div>
            <h2 className="font-display font-semibold text-lg mb-4">
              {results.length} Available Resource{results.length !== 1 ? "s" : ""}
            </h2>
            <div className="space-y-4">
              {results.map((r) => (
                <div
                  key={r.resource_id}
                  className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <h3 className="font-semibold text-[16px] text-neutral-900 dark:text-neutral-50">
                        {r.resource_name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-[13px] text-neutral-500 dark:text-neutral-400">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 font-medium text-[12px]">
                          {r.resource_type}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {r.building}, Floor {r.floor}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          Capacity {r.capacity}
                        </span>
                      </div>
                    </div>
                  </div>

                  {r.equipment_list && r.equipment_list.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {r.equipment_list.map((eq, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[12px] text-neutral-600 dark:text-neutral-400"
                        >
                          {eq.equipment_name}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-center gap-2 text-[13.5px]">
                      <Calendar className="w-4 h-4 text-neutral-400" />
                      <span className="text-neutral-700 dark:text-neutral-300">{formatDisplayDate(r.matchingSlot.date)}</span>
                      <span className="text-neutral-300 dark:text-neutral-600">·</span>
                      <Clock className="w-4 h-4 text-neutral-400" />
                      <span className="text-neutral-700 dark:text-neutral-300">
                        {r.matchingSlot.start_time} – {r.matchingSlot.end_time}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1.5 text-[13px] font-medium text-green-600 dark:text-green-400">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        Available
                      </span>
                      <button
                        onClick={() => openBookingModal(r)}
                        className="px-4 py-2 rounded-lg bg-green-600 text-white text-[13px] font-semibold hover:bg-green-700 transition-colors"
                      >
                        Book
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {bookingSlot && bookingResource && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display font-semibold text-lg">Confirm Booking</h3>
                <button onClick={() => { setBookingSlot(null); setBookingResource(null); }}
                  className="p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                  <X className="w-5 h-5 text-neutral-500" />
                </button>
              </div>

              <div className="space-y-3 mb-5">
                <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4">
                  <div className="font-semibold text-[15px] text-neutral-900 dark:text-neutral-50">
                    {bookingResource.resource_name}
                  </div>
                  <div className="text-[13px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {bookingResource.resource_type}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3">
                    <div className="text-[11px] uppercase tracking-wide text-neutral-400 mb-1">Date</div>
                    <div className="text-[13.5px] font-medium text-neutral-900 dark:text-neutral-50">
                      {formatDisplayDate(bookingSlot.date)}
                    </div>
                  </div>
                  <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3">
                    <div className="text-[11px] uppercase tracking-wide text-neutral-400 mb-1">Time</div>
                    <div className="text-[13.5px] font-medium text-neutral-900 dark:text-neutral-50">
                      {bookingSlot.start_time} – {bookingSlot.end_time}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3">
                    <div className="text-[11px] uppercase tracking-wide text-neutral-400 mb-1">Location</div>
                    <div className="text-[13.5px] font-medium text-neutral-900 dark:text-neutral-50">
                      {bookingResource.building}, Floor {bookingResource.floor}
                    </div>
                  </div>
                  <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3">
                    <div className="text-[11px] uppercase tracking-wide text-neutral-400 mb-1">Capacity</div>
                    <div className="text-[13.5px] font-medium text-neutral-900 dark:text-neutral-50">
                      {bookingResource.capacity}
                    </div>
                  </div>
                </div>

                {bookingResource.equipment_list && bookingResource.equipment_list.length > 0 && (
                  <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3">
                    <div className="text-[11px] uppercase tracking-wide text-neutral-400 mb-1.5">Equipment</div>
                    <div className="flex flex-wrap gap-1.5">
                      {bookingResource.equipment_list.map((eq, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-full bg-white dark:bg-neutral-700 text-[12px] text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-600">
                          {eq.equipment_name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {bookingError && (
                <div className="text-[13.5px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 mb-4">
                  {bookingError}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => { setBookingSlot(null); setBookingResource(null); }}
                  className="px-4 py-2.5 rounded-lg text-[14px] font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmBooking}
                  disabled={bookingLoading}
                  className="px-4 py-2.5 rounded-lg text-[14px] font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {bookingLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    "Confirm Booking"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {bookingSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl w-full max-w-md p-6">
              <div className="text-center mb-5">
                <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-500/10 flex items-center justify-center mx-auto mb-3">
                  <Check className="w-7 h-7 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-display font-semibold text-xl text-neutral-900 dark:text-neutral-50">
                  Booking Confirmed
                </h3>
              </div>

              <div className="space-y-2.5 mb-6">
                <div className="flex justify-between text-[14px]">
                  <span className="text-neutral-500 dark:text-neutral-400">Resource</span>
                  <span className="font-medium text-neutral-900 dark:text-neutral-50">{bookingSuccess.resource_name || bookingSuccess.resource_id}</span>
                </div>
                <div className="flex justify-between text-[14px]">
                  <span className="text-neutral-500 dark:text-neutral-400">Date</span>
                  <span className="font-medium text-neutral-900 dark:text-neutral-50">{formatDisplayDate(bookingSuccess.date)}</span>
                </div>
                <div className="flex justify-between text-[14px]">
                  <span className="text-neutral-500 dark:text-neutral-400">Time</span>
                  <span className="font-medium text-neutral-900 dark:text-neutral-50">{bookingSuccess.start_time} – {bookingSuccess.end_time}</span>
                </div>
                <div className="flex justify-between text-[14px]">
                  <span className="text-neutral-500 dark:text-neutral-400">Booking ID</span>
                  <span className="font-medium text-neutral-900 dark:text-neutral-50">{bookingSuccess.booking_id}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => navigate("/bookings")}
                  className="flex-1 px-4 py-2.5 rounded-lg text-[14px] font-medium border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  View My Bookings
                </button>
                <button
                  onClick={() => { setBookingSuccess(null); setSearched(false); setResults([]); }}
                  className="flex-1 px-4 py-2.5 rounded-lg text-[14px] font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                  Make Another Booking
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
