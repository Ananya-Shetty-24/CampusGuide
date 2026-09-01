import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, MapPin, Users, Wifi, WifiOff,
  ChevronLeft, ChevronRight, X, Check, Search, Calendar,
  LayoutDashboard, Compass
} from "lucide-react";
import {
  getResourceById,
  getResourceStatus,
  getResourceAvailability,
  createBooking
} from "../services/api.js";
import { useStatusStream } from "../hooks/useStatusStream.js";

const STATUS_CONFIG = {
  AVAILABLE:   { color: "bg-green-500", ring: "ring-green-200", text: "text-green-700", bg: "bg-green-50", label: "Available" },
  IN_USE:      { color: "bg-red-500",   ring: "ring-red-200",   text: "text-red-700",   bg: "bg-red-50",   label: "In Use" },
  RESERVED:    { color: "bg-yellow-500",ring: "ring-yellow-200",text: "text-yellow-700",bg: "bg-yellow-50", label: "Reserved" },
  MAINTENANCE: { color: "bg-blue-500",  ring: "ring-blue-200",  text: "text-blue-700",  bg: "bg-blue-50",  label: "Maintenance" }
};

function StatusBadge({ status, size = "md" }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.AVAILABLE;
  const sizeClasses = size === "lg"
    ? "px-4 py-2 text-[14px] gap-2.5"
    : "px-3 py-1.5 text-[13px] gap-2";

  return (
    <span className={`inline-flex items-center font-semibold rounded-full ring-1 ${cfg.bg} ${cfg.text} ${cfg.ring} ${sizeClasses}`}>
      <span className={`w-2.5 h-2.5 rounded-full ${cfg.color} ${status === "IN_USE" ? "animate-pulse" : ""}`} />
      {cfg.label}
    </span>
  );
}

function SkeletonLine({ className }) {
  return <div className={`animate-pulse bg-neutral-200 rounded ${className}`} />;
}

function ResourceDetail() {
  const { resourceId } = useParams();
  const navigate = useNavigate();
  const [resource, setResource] = useState(null);
  const [statusData, setStatusData] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(true);
  const [availLoading, setAvailLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusError, setStatusError] = useState(null);
  const [availError, setAvailError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  });
  const [bookingSlot, setBookingSlot] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(null);

  const { status: streamStatus, isConnected } = useStatusStream(resourceId);

  useEffect(() => {
    if (!resourceId) return;
    setLoading(true);
    setError(null);
    getResourceById(resourceId)
      .then(data => setResource(data.resource))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [resourceId]);

  useEffect(() => {
    if (!resourceId) return;
    setStatusLoading(true);
    setStatusError(null);
    getResourceStatus(resourceId)
      .then(data => setStatusData(data))
      .catch(err => setStatusError(err.message))
      .finally(() => setStatusLoading(false));
  }, [resourceId]);

  useEffect(() => {
    if (!resourceId) return;
    setAvailLoading(true);
    setAvailError(null);
    getResourceAvailability(resourceId, selectedDate)
      .then(data => setAvailability(data.availability || []))
      .catch(err => setAvailError(err.message))
      .finally(() => setAvailLoading(false));
  }, [resourceId, selectedDate]);

  const liveStatus = streamStatus?.live_status || statusData?.live_status;
  const currentStatus = liveStatus || statusData?.current_status;

  function shiftDate(delta) {
    const parts = selectedDate.split("-").map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    d.setDate(d.getDate() + delta);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    setSelectedDate(`${y}-${m}-${day}`);
  }

  function formatDisplayDate(dateStr) {
    const parts = dateStr.split("-").map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", weekday: "short" });
  }

  async function handleBooking() {
    if (!bookingSlot) return;
    setBookingLoading(true);
    setBookingError(null);
    setBookingSuccess(null);

    try {
      const result = await createBooking(resourceId, bookingSlot.availability_id);
      setBookingSuccess(result.booking);
      setBookingSlot(null);
      const refreshed = await getResourceAvailability(resourceId, selectedDate);
      setAvailability(refreshed.availability || []);
    } catch (err) {
      setBookingError(err.message);
    } finally {
      setBookingLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 font-sans">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
          .font-display { font-family: 'Fraunces', serif; letter-spacing: -0.01em; }
          .font-sans { font-family: 'IBM Plex Sans', sans-serif; }
        `}</style>
        <Header />
        <div className="max-w-4xl mx-auto px-6 md:px-8 py-10">
          <SkeletonLine className="h-5 w-32 mb-8" />
          <SkeletonLine className="h-10 w-3/4 mb-3" />
          <SkeletonLine className="h-5 w-1/2 mb-8" />
          <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-4">
            <SkeletonLine className="h-6 w-32 mb-4" />
            <SkeletonLine className="h-16 w-full" />
          </div>
          <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-4">
            <SkeletonLine className="h-6 w-40 mb-4" />
            {[1,2,3].map(i => (
              <SkeletonLine key={i} className="h-14 w-full mb-3 last:mb-0" />
            ))}
          </div>
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <SkeletonLine className="h-6 w-32 mb-4" />
            {[1,2,3].map(i => (
              <SkeletonLine key={i} className="h-12 w-full mb-2 last:mb-0" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !resource) {
    return (
      <div className="min-h-screen bg-neutral-50 font-sans">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
          .font-display { font-family: 'Fraunces', serif; letter-spacing: -0.01em; }
          .font-sans { font-family: 'IBM Plex Sans', sans-serif; }
        `}</style>
        <Header />
        <div className="max-w-4xl mx-auto px-6 md:px-8 py-20 text-center">
          <h2 className="font-display font-semibold text-2xl mb-2">Resource not found</h2>
          <p className="text-neutral-500 text-[15px] mb-6">{error || "The resource you're looking for doesn't exist."}</p>
          <Link to="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-black text-white font-semibold text-sm hover:bg-neutral-800 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Search
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .font-display { font-family: 'Fraunces', serif; letter-spacing: -0.01em; }
        .font-sans { font-family: 'IBM Plex Sans', sans-serif; }
      `}</style>

      <Header />

      <main className="max-w-4xl mx-auto px-6 md:px-8 py-8">
        <Link to="/" className="inline-flex items-center gap-1.5 text-[13.5px] text-neutral-500 hover:text-red-500 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Search
        </Link>

        <h1 className="font-display font-semibold text-[36px] md:text-[40px] leading-tight mb-3">
          {resource.resource_name}
        </h1>

        <div className="flex flex-wrap items-center gap-3 text-[14px] text-neutral-500 mb-8">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-50 text-green-700 font-medium text-[13px]">
            {resource.resource_type}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-neutral-400" />
            {resource.building}
          </span>
          <span className="text-neutral-300">·</span>
          <span>Floor {resource.floor}</span>
          <span className="text-neutral-300">·</span>
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-neutral-400" />
            Capacity {resource.capacity}
          </span>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[15px]">Current Status</h2>
            <div className="flex items-center gap-1.5 text-[12.5px] font-medium">
              {isConnected ? (
                <span className="flex items-center gap-1.5 text-green-600">
                  <Wifi className="w-3.5 h-3.5" />
                  Live
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-neutral-400">
                  <WifiOff className="w-3.5 h-3.5" />
                  Offline
                </span>
              )}
            </div>
          </div>

          {statusLoading ? (
            <div className="flex items-center gap-2 text-[14px] text-neutral-500">
              <div className="w-4 h-4 border-2 border-neutral-300 border-t-transparent rounded-full animate-spin" />
              Checking current status...
            </div>
          ) : statusError ? (
            <div className="text-[14px] text-red-500 bg-red-50 rounded-lg px-4 py-3">
              Live status unavailable. {statusError}
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <StatusBadge status={liveStatus || "AVAILABLE"} size="lg" />
              <div className="text-[13px] text-neutral-400">
                {statusData?.updated_at && (
                  <>Updated {new Date(statusData.updated_at).toLocaleTimeString()}</>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-4">
          <h2 className="font-semibold text-[15px] mb-4">Equipment</h2>
          {resource.equipment && resource.equipment.length > 0 ? (
            <div className="divide-y divide-neutral-100">
              {resource.equipment.map(eq => (
                <div key={eq.equipment_id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-[14px] font-semibold text-neutral-500">
                      {eq.category ? eq.category.charAt(0) : "E"}
                    </div>
                    <div>
                      <div className="text-[14.5px] font-medium text-neutral-900">{eq.equipment_name}</div>
                      <div className="text-[12.5px] text-neutral-400 mt-0.5">{eq.category}</div>
                    </div>
                  </div>
                  <div className="text-[14px] font-semibold text-neutral-600">
                    × {eq.quantity}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[14px] text-neutral-400">No equipment information available.</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[15px]">Schedule</h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => shiftDate(-1)}
                className="p-1.5 rounded-md hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 transition-colors"
                aria-label="Previous day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[13.5px] font-medium px-2 min-w-[130px] text-center">
                {formatDisplayDate(selectedDate)}
              </span>
              <button
                onClick={() => shiftDate(1)}
                className="p-1.5 rounded-md hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 transition-colors"
                aria-label="Next day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {availLoading ? (
            <div className="flex items-center gap-2 text-[14px] text-neutral-500 py-4">
              <div className="w-4 h-4 border-2 border-neutral-300 border-t-transparent rounded-full animate-spin" />
              Loading schedule...
            </div>
          ) : availError ? (
            <div className="text-[14px] text-red-500 bg-red-50 rounded-lg px-4 py-3">
              Unable to load availability. {availError}
            </div>
          ) : availability.length === 0 ? (
            <p className="text-[14px] text-neutral-400 py-4">No scheduled availability for this date.</p>
          ) : (
            <div className="space-y-2">
              {availability.map(slot => {
                const isAvailable = slot.status === "Available" && !slot.booked;
                const isBooked = slot.booked;
                return (
                  <div
                    key={slot.availability_id}
                    className={`flex items-center justify-between px-4 py-3.5 rounded-lg border transition-colors ${
                      isBooked
                        ? "bg-neutral-50 border-neutral-100"
                        : isAvailable
                        ? "bg-green-50/50 border-green-100"
                        : "bg-neutral-50 border-neutral-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${
                        isBooked ? "bg-neutral-400" : isAvailable ? "bg-green-500" : "bg-neutral-300"
                      }`} />
                      <span className="text-[14.5px] font-medium tabular-nums text-neutral-900">
                        {slot.start_time} – {slot.end_time}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {isAvailable ? (
                        <>
                          <span className="text-[13.5px] font-medium text-green-700">Available</span>
                          <button
                            onClick={() => { setBookingSlot(slot); setBookingError(null); setBookingSuccess(null); }}
                            className="px-4 py-2 rounded-lg bg-green-600 text-white text-[13px] font-semibold hover:bg-green-700 transition-colors"
                          >
                            Book
                          </button>
                        </>
                      ) : isBooked ? (
                        <span className="text-[13.5px] font-medium text-neutral-500">Booked</span>
                      ) : (
                        <span className="text-[13.5px] font-medium text-neutral-400">{slot.status}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {bookingSlot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-lg">Confirm Booking</h3>
                <button onClick={() => setBookingSlot(null)} className="p-1 rounded-md hover:bg-neutral-100 transition-colors">
                  <X className="w-5 h-5 text-neutral-500" />
                </button>
              </div>
              <div className="text-[14px] text-neutral-600 mb-5 leading-relaxed">
                Book <strong className="text-neutral-900">{resource.resource_name}</strong> on{" "}
                <strong className="text-neutral-900">{formatDisplayDate(selectedDate)}</strong> from{" "}
                <strong className="text-neutral-900">{bookingSlot.start_time}</strong> to{" "}
                <strong className="text-neutral-900">{bookingSlot.end_time}</strong>?
              </div>
              {bookingError && (
                <div className="text-[13.5px] text-red-600 bg-red-50 rounded-lg px-4 py-3 mb-4">{bookingError}</div>
              )}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setBookingSlot(null)}
                  className="px-4 py-2.5 rounded-lg text-[14px] font-medium hover:bg-neutral-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBooking}
                  disabled={bookingLoading}
                  className="px-4 py-2.5 rounded-lg text-[14px] font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {bookingLoading ? "Booking..." : "Confirm Booking"}
                </button>
              </div>
            </div>
          </div>
        )}

        {bookingSuccess && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-5 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="font-semibold text-green-800 text-[15px]">Booking Confirmed</div>
              <div className="text-[13.5px] text-green-700 mt-1">
                {formatDisplayDate(bookingSuccess.date)}, {bookingSuccess.start_time} – {bookingSuccess.end_time}
              </div>
              <div className="text-[12.5px] text-green-600 mt-1">
                Booking ID: {bookingSuccess.booking_id}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Header() {
  const navigate = useNavigate();

  const navLinks = [
    { label: "Dashboard", icon: LayoutDashboard, onClick: () => navigate("/dashboard") },
    { label: "Explore Campus", icon: Compass, onClick: () => navigate("/") },
    { label: "Bookings", icon: Calendar, onClick: () => navigate("/bookings") },
  ];

  return (
    <header className="bg-black text-white border-b border-transparent">
      <div className="max-w-5xl mx-auto px-6 md:px-8 h-16 flex items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 rounded-md bg-red-500 flex items-center justify-center">
            <Search className="w-4 h-4 text-black" />
          </div>
          <span className="font-display font-semibold text-lg tracking-tight">
            CampusGuide
          </span>
        </Link>

        <nav className="hidden sm:flex items-center gap-1 flex-1">
          {navLinks.map(({ label, icon: Icon, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13.5px] font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <Link to="/login" className="text-[13.5px] font-medium text-white/70 hover:text-white transition-colors">
            Sign in
          </Link>
        </div>
      </div>
    </header>
  );
}

export default ResourceDetail;
