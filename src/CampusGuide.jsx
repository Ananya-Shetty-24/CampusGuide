import { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search, Clock, Layers, MessageSquare, Users,
  MapPin, Camera, ChevronDown, ChevronUp, PenSquare
} from "lucide-react";
import { searchCampus, getSearchSuggestions } from "./services/api.js";

// -----------------------------------------------------------------------
// API INTEGRATION
// Search functionality connects to the backend API at localhost:3001
// -----------------------------------------------------------------------

// Wireframe globe mark, echoing the brand logo: white sphere lines on black,
// red wordmark alongside it.
function LogoMark({ size = 28 }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} fill="none">
      <circle cx="24" cy="24" r="19" stroke="white" strokeWidth="1.2" />
      <ellipse cx="24" cy="24" rx="8" ry="19" stroke="white" strokeWidth="1.2" />
      <ellipse cx="24" cy="24" rx="19" ry="8" stroke="white" strokeWidth="1.2" />
      <ellipse cx="24" cy="24" rx="19" ry="8" stroke="white" strokeWidth="1.2" transform="rotate(55 24 24)" />
      <ellipse cx="24" cy="24" rx="19" ry="8" stroke="white" strokeWidth="1.2" transform="rotate(-55 24 24)" />
    </svg>
  );
}

const CHIPS = [
  { label: "Study room", fill: "a study room" },
  { label: "Lab", fill: "a lab" },
  { label: "Lecture hall", fill: "a lecture hall for 60" },
  { label: "Equipment", fill: "a DSLR camera to borrow" },
  { label: "Available now", fill: "available right now" },
];

const FLOW = [
  { title: "You describe what you need", body: "Group size, equipment, building, date and time, all in one sentence — no forms or dropdowns required." },
  { title: "Genie interprets the request", body: "Databricks Genie maps your wording to the resource and availability tables, resolving synonyms like \u201cbeamer\u201d for \u201cprojector.\u201d" },
  { title: "Availability gets checked", body: "Results are filtered against the live schedule so nothing booked or under maintenance shows up as an option." },
  { title: "You get a ranked, explained answer", body: "Each result comes with a short reason it fits — and you can refine it conversationally, without starting over." },
];

const FEATURES = [
  { icon: Search, title: "Natural language search", body: "Capacity, equipment, location, date, and time, parsed from one sentence instead of five separate filters." },
  { icon: Layers, title: "Rooms and equipment together", body: "Standalone gear like cameras and 3D printers is searched the same way as classrooms and labs." },
  { icon: Clock, title: "Availability-aware results", body: "Only resources genuinely free in your requested window are returned — never a room that looks free but isn't." },
  { icon: PenSquare, title: "Plain-English explanations", body: "Every match says why it fits your request, so you're not left guessing what the ranking means." },
  { icon: MessageSquare, title: "Conversational refinement", body: "\u201cCloser to the library instead\u201d or \u201cmake it 20 people\u201d — CampusGuide adjusts without losing earlier context." },
  { icon: Users, title: "Role-aware results", body: "Students and faculty can see different permissioned resources and priority booking rules automatically." },
];

export default function CampusGuide() {
  const [query, setQuery] = useState("");
  const [activeChip, setActiveChip] = useState(null);
  const [searched, setSearched] = useState(false);
  const [lastQuery, setLastQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const fetchSuggestions = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.trim() === '') {
      setSuggestions([]);
      return;
    }
    
    try {
      const data = await getSearchSuggestions(searchQuery, 6);
      setSuggestions(data.suggestions || []);
    } catch (err) {
      console.error('Suggestions error:', err);
      setSuggestions([]);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSuggestions(query);
    }, 200);
    
    return () => clearTimeout(timeoutId);
  }, [query, fetchSuggestions]);

  async function runSearch(text, filter = activeFilter) {
    const t = (text ?? query).trim();
    if (!t) return;
    
    setLoading(true);
    setError(null);
    setShowSuggestions(false);
    
    try {
      const data = await searchCampus(t, filter, 20);
      setResults(data.results || []);
      setLastQuery(t);
      setSearched(true);
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message || 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function handleFilterChange(filter) {
    setActiveFilter(filter);
    if (searched && lastQuery) {
      runSearch(lastQuery, filter);
    }
  }

  function handleChip(chip) {
    setActiveChip(chip.label);
    const prefix = query.trim();
    const newQuery = prefix ? prefix : chip.fill;
    setQuery(newQuery);
    runSearch(newQuery);
  }

  function handleSuggestionClick(suggestion) {
    setQuery(suggestion.label);
    setShowSuggestions(false);
    runSearch(suggestion.label);
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .font-display { font-family: 'Fraunces', serif; letter-spacing: -0.01em; }
        .font-sans { font-family: 'IBM Plex Sans', sans-serif; }
        .font-code { font-family: 'IBM Plex Mono', monospace; }
        .hero-grid-bg {
          background-image: linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
          background-size: 44px 44px;
          -webkit-mask-image: linear-gradient(to right, transparent, black 35%, black 70%, transparent);
          mask-image: linear-gradient(to right, transparent, black 35%, black 70%, transparent);
        }
        .hero-glow-a {
          background: radial-gradient(ellipse 900px 550px at 50% 50%, rgba(225,29,72,0.4), transparent 65%);
          animation: glow-drift-a 16s ease-in-out infinite;
        }
        .hero-glow-b {
          background: radial-gradient(ellipse 700px 600px at 50% 50%, rgba(225,29,72,0.28), transparent 65%);
          animation: glow-drift-b 20s ease-in-out infinite;
        }
        @keyframes glow-drift-a {
          0%, 100% { transform: translate(8%, -6%) scale(1); }
          50% { transform: translate(-4%, 4%) scale(1.12); }
        }
        @keyframes glow-drift-b {
          0%, 100% { transform: translate(-2%, 14%) scale(1); }
          50% { transform: translate(6%, 2%) scale(1.08); }
        }
        .wave-path {
          stroke-dasharray: 8 14;
          animation: wave-flow 8s linear infinite;
          transition: stroke-width 0.4s ease, stroke-opacity 0.4s ease, filter 0.4s ease;
        }
        .wave-path.w2 { animation-duration: 11s; animation-direction: reverse; }
        .wave-path.w3 { animation-duration: 14s; }
        @keyframes wave-flow {
          to { stroke-dashoffset: -440; }
        }
        .wave-hit { cursor: pointer; }
        .wave-hit:hover + .wave-path {
          stroke-width: 3.2;
          stroke-opacity: 1;
          filter: drop-shadow(0 0 9px rgba(225,29,72,0.85)) drop-shadow(0 0 20px rgba(225,29,72,0.4));
        }
        .ember {
          position: absolute;
          border-radius: 9999px;
          background: #e11d48;
          animation: ember-rise linear infinite;
        }
        @keyframes ember-rise {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          12% { opacity: 0.8; }
          85% { opacity: 0.5; }
          100% { transform: translateY(-260px) translateX(var(--drift, 20px)); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-glow-a, .hero-glow-b, .wave-path, .ember { animation: none !important; }
        }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-black border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 md:px-8 h-[76px] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* /<LogoMark size={26} /> */}
            {/* <span className="font-display font-semibold text-xl text-red-500 tracking-tight">CampusGuide</span> */}
            <img src="/logo.png" className="h-16" />
          </div>
          <nav className="hidden md:flex items-center gap-8 text-[15px] font-medium text-white/75">
            <a href="#how" className="hover:text-white">How it works</a>
            <a href="#features" className="hover:text-white">Features</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="hidden md:inline-flex px-5 py-2.5 rounded-md border border-white/30 text-white text-sm font-semibold hover:border-white">Sign in</Link>
            
            {/* <a href="#search" className="inline-flex px-5 py-2.5 rounded-md bg-red-500 text-neutral-900 text-sm font-semibold hover:bg-red-600">Open search</a> */}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-black text-white pt-16">
        <div className="absolute -inset-32 hero-glow-a" />
        <div className="absolute -inset-32 hero-glow-b" />
        <div className="absolute inset-0 hero-grid-bg" />
        <svg className="absolute right-0 top-0 h-full w-[55%] opacity-70" viewBox="0 0 800 800" preserveAspectRatio="xMaxYMid slice" fill="none">
          <path className="wave-hit" d="M120 700 C 350 620, 380 380, 620 340 S 900 120, 1000 20" stroke="transparent" strokeWidth="36" pointerEvents="stroke" />
          <path className="wave-path w1" d="M120 700 C 350 620, 380 380, 620 340 S 900 120, 1000 20" stroke="#e11d48" strokeOpacity="0.55" strokeWidth="1.5" pointerEvents="none" />
          <path className="wave-hit" d="M180 760 C 400 660, 420 420, 660 380 S 940 160, 1040 60" stroke="transparent" strokeWidth="36" pointerEvents="stroke" />
          <path className="wave-path w2" d="M180 760 C 400 660, 420 420, 660 380 S 940 160, 1040 60" stroke="#e11d48" strokeOpacity="0.35" strokeWidth="1.5" pointerEvents="none" />
          <path className="wave-hit" d="M60 640 C 300 580, 340 340, 580 300 S 860 80, 960 -20" stroke="transparent" strokeWidth="36" pointerEvents="stroke" />
          <path className="wave-path w3" d="M60 640 C 300 580, 340 340, 580 300 S 860 80, 960 -20" stroke="#e11d48" strokeOpacity="0.25" strokeWidth="1.5" pointerEvents="none" />
        </svg>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(16)].map((_, i) => {
            const left = 4 + ((i * 6.1) % 92);
            const size = 2 + (i % 3);
            const duration = 9 + (i % 5) * 2.2;
            const delay = -(i * 1.7);
            const drift = (i % 2 === 0 ? 1 : -1) * (14 + (i % 4) * 8);
            return (
              <span
                key={i}
                className="ember"
                style={{
                  left: `${left}%`,
                  bottom: "-10px",
                  width: size,
                  height: size,
                  animationDuration: `${duration}s`,
                  animationDelay: `${delay}s`,
                  ["--drift"]: `${drift}px`,
                }}
              />
            );
          })}
        </div>
        <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-8">
          <h1 className="font-display font-semibold text-4xl md:text-6xl max-w-3xl leading-[1.08] pt-2">
            Find a room or piece of equipment by <span className="text-red-400">just describing it.</span>
          </h1>
          <p className="text-lg md:text-xl text-white/70 max-w-xl mt-5 mb-10">
            Tell CampusGuide what you need — group size, equipment, building, date, time. It reads your request, checks real availability, and explains exactly why each result fits.
          </p>

          {/* Search card */}
          <div id="search" className="bg-white rounded-xl p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] max-w-3xl relative">
            <div className="flex gap-2.5">
              <div className="flex-1 flex items-center gap-2.5 border border-neutral-200 rounded-lg px-4 bg-neutral-50 relative">
                <Search className="w-[18px] h-[18px] text-neutral-400 flex-shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  onKeyDown={(e) => e.key === "Enter" && runSearch()}
                  placeholder="Search equipment, labs, rooms... (e.g. gpu, 3d printer, library)"
                  className="w-full bg-transparent outline-none py-4 text-[15.5px] text-neutral-900 placeholder:text-neutral-400"
                />
                
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                    <div className="p-2 text-xs font-semibold text-neutral-500 uppercase tracking-wide border-b border-neutral-100">
                      Suggestions
                    </div>
                    {suggestions.map((s, idx) => (
                      <button
                        key={`${s.type}-${s.id}-${idx}`}
                        onMouseDown={() => handleSuggestionClick(s)}
                        className="w-full text-left px-3 py-2 hover:bg-neutral-50 flex items-center gap-3"
                      >
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          s.type === 'equipment' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {s.type === 'equipment' ? 'EQ' : 'RES'}
                        </span>
                        <div>
                          <div className="text-sm font-medium text-neutral-900">{s.label}</div>
                          <div className="text-xs text-neutral-500">{s.subtitle}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => runSearch()}
                disabled={loading}
                className="px-6 rounded-lg bg-red-500 text-neutral-900 font-semibold text-[15px] hover:bg-red-600 disabled:opacity-50"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
            
            {/* Filter buttons */}
            <div className="flex flex-wrap gap-2 mt-3.5">
              {[
                { key: 'all', label: 'All' },
                { key: 'equipment', label: 'Equipment' },
                { key: 'resources', label: 'Resources' },
                { key: 'locations', label: 'Locations' }
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => handleFilterChange(filter.key)}
                  className={`text-[13px] font-medium px-3.5 py-1.5 rounded-full border transition-colors ${
                    activeFilter === filter.key
                      ? "bg-black text-white border-black"
                      : "bg-neutral-50 text-neutral-600 border-neutral-200 hover:border-red-400 hover:text-neutral-900"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            
            {/* Quick suggestion chips */}
            <div className="flex flex-wrap gap-2 mt-2">
              {CHIPS.map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => handleChip(chip)}
                  className={`text-[12px] font-medium px-2.5 py-1 rounded-full border transition-colors ${
                    activeChip === chip.label
                      ? "bg-red-500 text-white border-red-500"
                      : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-7 my-7 pb-14 text-[13.5px] text-white/55">
            <div className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> Live availability, not a static list</div>
            <div className="flex items-center gap-1.5"><Layers className="w-4 h-4" /> Rooms and equipment in one search</div>
          </div>
        </div>
      </section>

      {/* Results */}
      {searched && (
        <section className="bg-neutral-50 py-10">
          <div className="max-w-6xl mx-auto px-6 md:px-8">
            <div className="flex items-baseline justify-between flex-wrap gap-2 mb-4">
              <div>
                <h3 className="font-display font-semibold text-xl">
                  {loading ? "Searching..." : results.length ? `${results.length} matches` : "No matches found"}
                </h3>
                <p className="text-sm text-neutral-500">for "{lastQuery}"</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[12px] text-neutral-400 uppercase tracking-wide">
                  Filter: {activeFilter}
                </span>
              </div>
            </div>

            {error && (
              <div className="text-center text-red-600 bg-red-50 rounded-lg border border-red-200 p-4 mb-4">
                {error}
              </div>
            )}

            {!loading && results.length === 0 && !error && (
              <div className="text-center text-neutral-500 bg-white rounded-lg border border-dashed border-neutral-200 p-10">
                No matching campus resources or equipment found. Try a different search term.
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {results.map((r, idx) => (
                  <div key={`${r.type}-${r.id}-${idx}`} className="bg-white border border-neutral-200 rounded-lg p-5 flex flex-col gap-2.5">
                    <div className="flex justify-between items-start gap-2.5">
                      <h4 className="font-semibold text-[17px]">{r.name}</h4>
                      <span className={`text-[11.5px] font-semibold px-2.5 py-1 rounded whitespace-nowrap ${
                        r.type === 'equipment' 
                          ? 'bg-blue-100 text-blue-700' 
                          : r.type === 'resource'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {r.type === 'equipment' ? r.category : r.type === 'resource' ? r.resource_type : 'Location'}
                      </span>
                    </div>
                    
                    {r.type === 'equipment' && (
                      <>
                        <div className="text-[13.5px] text-neutral-500 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                          {r.location?.name} · {r.location?.building} · Floor {r.location?.floor}
                        </div>
                        <div className="text-[13.5px] text-neutral-600">
                          Quantity: {r.quantity}
                        </div>
                      </>
                    )}
                    
                    {r.type === 'resource' && (
                      <>
                        <div className="text-[13.5px] text-neutral-500 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                          {r.building} · Floor {r.floor}
                        </div>
                        <div className="text-[13.5px] text-neutral-600">
                          Capacity: {r.capacity}
                        </div>
                        {r.equipment && r.equipment.length > 0 && (
                          <div className="text-[12.5px] text-neutral-400 mt-1">
                            Equipment: {r.equipment.join(" · ")}
                          </div>
                        )}
                      </>
                    )}
                    
                    {r.type === 'location' && (
                      <>
                        <div className="text-[13.5px] text-neutral-500 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                          {r.building}
                        </div>
                        {r.resources && r.resources.length > 0 && (
                          <div className="text-[12.5px] text-neutral-500 mt-1">
                            {r.resources.length} resource(s) in this building
                          </div>
                        )}
                      </>
                    )}
                    
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-neutral-100">
                      <div className="text-[11px] text-neutral-400">
                        Score: {r.score}
                      </div>
                      <Link
                        to={
                          r.type === "equipment" ? `/resources/${r.resource_id}` :
                          r.type === "resource" ? `/resources/${r.id}` :
                          "/"
                        }
                        className="text-[13.5px] font-semibold border-b-[1.5px] border-red-400 pb-px hover:text-red-500 transition-colors"
                      >
                        {r.type === "equipment" ? "View Resource" : r.type === "resource" ? "View Resource" : "Browse"}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* How it works */}
      <section id="how" className="relative bg-neutral-50 py-20">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <div className="max-w-xl mb-12">
            <div className="w-9 h-[3px] bg-red-500 rounded-sm mb-4" />
            <h2 className="font-display font-semibold text-3xl md:text-[34px] mb-3">From a plain-English request to a ranked answer</h2>
            <p className="text-neutral-500 text-[16.5px]">CampusGuide sits on top of Databricks Genie, which turns your sentence into a real query against curated campus data — not a keyword search against a static spreadsheet.</p>
          </div>
          <div className="flex flex-col md:flex-row gap-8 md:gap-0">
            {FLOW.map((step, i) => (
              <div key={step.title} className={`flex-1 relative pr-6 ${i !== FLOW.length - 1 ? "md:border-r md:border-neutral-200" : ""}`}>
                <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-display font-semibold text-base mb-4">
                  {i + 1}
                </div>
                <h4 className="font-semibold text-[16.5px] mb-2">{step.title}</h4>
                <p className="text-sm text-neutral-500">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-black text-white py-20">
        <div className="max-w-6xl mx-auto px-6 md:px-8 mb-12">
          <div className="w-9 h-[3px] bg-red-500 rounded-sm mb-4" />
          <h2 className="font-display font-semibold text-3xl md:text-[34px] mb-3">What CampusGuide handles for you</h2>
          <p className="text-white/65 text-[16.5px] max-w-xl">The core discovery experience, built to replace manually cross-checking room lists, equipment logs, and booking calendars.</p>
        </div>
        <div className="max-w-6xl mx-auto border-t border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-3">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              const lastCol = (i + 1) % 3 === 0;
              return (
                <div key={f.title} className={`p-7 border-b border-white/10 ${!lastCol ? "md:border-r md:border-white/10" : ""} px-6 md:px-8`}>
                  <Icon className="w-7 h-7 text-red-400 mb-4" strokeWidth={1.6} />
                  <h4 className="font-display font-semibold text-[16.5px] mb-2">{f.title}</h4>
                  <p className="text-sm text-white/60">{f.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white/55 py-12 text-[13.5px]">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <div className="flex justify-between items-center flex-wrap gap-4 pb-7 border-b border-white/10 mb-6">
            <div className="flex items-center gap-2">
              {/* <LogoMark size={22} />
              <span className="font-display font-semibold text-lg text-red-500 tracking-tight">CampusGuide</span> */}
              <img src="/logo.png" className="h-11" />
            </div>
            <div className="flex gap-6">
              <a href="#how" className="hover:text-white">How it works</a>
              <a href="#features" className="hover:text-white">Features</a>
            </div>
          </div>
          <div>Hackathon project — powered by Databricks Genie on curated, synthetically generated campus data.</div>
        </div>
      </footer>
    </div>
  );
}
