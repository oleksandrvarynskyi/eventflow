"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import QRScanner from "@/components/QRScanner";

type ReceptionMode = "scanner" | "manual";

type CheckInResult = {
  status: "ACCESS_GRANTED" | "ALREADY_CHECKED_IN" | "INVALID_TICKET";
  message: string;
  attendeeName?: string;
  checkedInAt?: string;
};

type Attendee = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  registrationToken: string | null;
  checkedInAt: string | null;
};

type Event = {
  id: number;
  name: string;
  location: string | null;
  startsAt: string;
};

export default function Home() {
  const searchParams = useSearchParams();
  const eventIdParam = searchParams.get("eventId");
  const [result, setResult] = useState<CheckInResult | null>(null);
  const notificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [receptionMode, setReceptionMode] = useState<ReceptionMode>("scanner");
  const [attendeeSearch, setAttendeeSearch] = useState("");
  const [checkingInAttendeeId, setCheckingInAttendeeId] = useState<
    number | null
  >(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [eventsLoading, setEventsLoading] = useState(true);

  useEffect(() => {
    return () => {
      if (notificationTimerRef.current !== null) {
        clearTimeout(notificationTimerRef.current);
      }
    };
  }, []);

  function showNotification(data: CheckInResult) {
    if (notificationTimerRef.current !== null) {
      clearTimeout(notificationTimerRef.current);
    }

    setResult(data);

    notificationTimerRef.current = setTimeout(() => {
      setResult(null);
      notificationTimerRef.current = null;
    }, 3000);
  }

  useEffect(() => {
    async function loadEvents() {
      try {
        const response = await fetch("/api/reception/events", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load events");
        }

        const data: Event[] = await response.json();

        setEvents(data);

        if (data.length > 0) {
          const requestedEventId = Number(eventIdParam);

          const matchingEvent = data.find(
            (event) => event.id === requestedEventId,
          );

          setSelectedEventId(matchingEvent?.id ?? data[0].id);
        }
      } catch (error) {
        console.error("Failed to load events:", error);
      } finally {
        setEventsLoading(false);
      }
    }

    void loadEvents();
  }, [eventIdParam]);
  const loadAttendees = useCallback(async () => {
    if (selectedEventId === null) return;

    setStatsLoading(true);

    try {
      const response = await fetch(
        `/api/reception/events/${selectedEventId}/attendees`,
        { cache: "no-store" },
      );

      if (!response.ok) {
        throw new Error("Failed to load attendees");
      }

      const data: Attendee[] = await response.json();
      setAttendees(data);
    } catch (error) {
      console.error("Failed to load attendees:", error);
    } finally {
      setStatsLoading(false);
    }
  }, [selectedEventId]);

  useEffect(() => {
    if (selectedEventId === null) return;

    setAttendees([]);
    void loadAttendees();
  }, [selectedEventId, loadAttendees]);

  const totalAttendees = attendees.length;

  const checkedIn = attendees.filter(
    (attendee) => attendee.checkedInAt !== null,
  ).length;

  const expected = totalAttendees - checkedIn;

  const filteredAttendees = attendees
    .filter((attendee) => {
      const query = attendeeSearch.trim().toLowerCase();

      if (!query) return false;

      const fullName =
        `${attendee.firstName} ${attendee.lastName}`.toLowerCase();

      return (
        attendee.firstName.toLowerCase().includes(query) ||
        attendee.lastName.toLowerCase().includes(query) ||
        attendee.email.toLowerCase().includes(query) ||
        fullName.includes(query)
      );
    })
    .sort((a, b) => a.id - b.id)
    .slice(0, 10);

  const recentCheckIns = attendees
    .filter((attendee) => attendee.checkedInAt !== null)
    .sort(
      (a, b) =>
        new Date(b.checkedInAt!).getTime() - new Date(a.checkedInAt!).getTime(),
    )
    .slice(0, 5);

  async function handleCheckIn(ticketToken: string) {
    if (!ticketToken.trim() || selectedEventId === null) return;

    setLoading(true);
    setResult(null);
    setError("");

    try {
      const response = await fetch(
        `/api/reception/events/${selectedEventId}/check-in`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ registrationToken: ticketToken.trim() }),
        },
      );

      if (!response.ok) {
        throw new Error("Server returned an error");
      }

      const data: CheckInResult = await response.json();
      showNotification(data);

      await loadAttendees();
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  async function handleManualCheckIn(attendee: Attendee) {
    if (!attendee.registrationToken || attendee.checkedInAt || loading) {
      return;
    }

    setCheckingInAttendeeId(attendee.id);

    try {
      await handleCheckIn(attendee.registrationToken);
    } finally {
      setCheckingInAttendeeId(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-4 text-white md:px-6">
      <div className="mx-auto w-full max-w-[1600px] rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
        {/* COMPACT HEADER */}
        <div className="mb-4 rounded-xl border border-slate-700 bg-slate-950/40 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* TITLE */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold tracking-widest text-blue-400">
                EVENTFLOW
              </span>

              <span className="text-slate-600">|</span>

              <h1 className="text-xl font-bold">Reception Dashboard</h1>
            </div>

            {/* EVENT SELECT */}
            <div className="flex w-full items-center gap-3 sm:w-auto">
              <label
                htmlFor="event-select"
                className="shrink-0 text-sm font-medium text-slate-400"
              >
                Event:
              </label>

              <select
                id="event-select"
                value={selectedEventId ?? ""}
                onChange={(e) => {
                  setSelectedEventId(Number(e.target.value));
                  setResult(null);
                  setError("");
                  setScannerOpen(false);
                  setReceptionMode("scanner");
                  setAttendeeSearch("");
                }}
                disabled={eventsLoading || events.length === 0}
                className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-blue-500 sm:w-[300px] sm:flex-none"
              >
                {eventsLoading ? (
                  <option value="">Loading events...</option>
                ) : events.length === 0 ? (
                  <option value="">No events available</option>
                ) : (
                  events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* COMPACT STATISTICS */}
          <div className="mt-3 flex flex-wrap items-center gap-x-8 gap-y-2 border-t border-slate-800 pt-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">Total:</span>
              <span className="text-lg font-bold">
                {statsLoading ? "..." : totalAttendees}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-green-400">Checked In:</span>
              <span className="text-lg font-bold text-green-400">
                {statsLoading ? "..." : checkedIn}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-blue-400">Expected:</span>
              <span className="text-lg font-bold text-blue-400">
                {statsLoading ? "..." : expected}
              </span>
            </div>
          </div>
        </div>

        {/* RECEPTION WORKSPACE */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <section className="min-w-0 rounded-xl border border-slate-700 bg-slate-950/40 p-5">
            {/* RECEPTION MODE SWITCHER */}
            <div className="mb-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setReceptionMode("scanner");
                  setResult(null);
                  setError("");
                  setAttendeeSearch("");
                }}
                className={`rounded-lg px-4 py-3 text-sm font-semibold transition ${
                  receptionMode === "scanner"
                    ? "bg-blue-600 text-white"
                    : "border border-slate-700 bg-slate-950 text-slate-400 hover:text-white"
                }`}
              >
                QR Scanner
              </button>

              <button
                type="button"
                onClick={() => {
                  setReceptionMode("manual");
                  setScannerOpen(false);
                  setResult(null);
                  setError("");
                }}
                className={`rounded-lg px-4 py-3 text-sm font-semibold transition ${
                  receptionMode === "manual"
                    ? "bg-blue-600 text-white"
                    : "border border-slate-700 bg-slate-950 text-slate-400 hover:text-white"
                }`}
              >
                Manual Check-in
              </button>
            </div>

            {receptionMode === "scanner" ? (
              <div>
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => setScannerOpen(!scannerOpen)}
                    className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
                      scannerOpen
                        ? "border border-slate-600 bg-slate-800 text-white hover:bg-slate-700"
                        : "bg-blue-600 text-white hover:bg-blue-500"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <rect x="3" y="3" width="7" height="7" rx="1" />
                      <rect x="14" y="3" width="7" height="7" rx="1" />
                      <rect x="3" y="14" width="7" height="7" rx="1" />
                      <path d="M14 14h3v3h-3zM21 14v3M17 21h4M14 21v-2" />
                    </svg>

                    {scannerOpen ? "Stop Camera" : "Start Camera"}
                  </button>
                </div>

                {scannerOpen && (
                  <div className="mx-auto mt-4 w-full max-w-[400px]">
                    <QRScanner onScan={handleCheckIn} />
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-slate-700 bg-slate-950 p-6">
                <h2 className="text-lg font-semibold">Manual Check-in</h2>

                <p className="mt-2 text-sm text-slate-400">
                  Search for a registered attendee by name or email.
                </p>

                <input
                  type="search"
                  value={attendeeSearch}
                  onChange={(e) => setAttendeeSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  className="mt-5 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-500"
                />

                {attendeeSearch.trim() && (
                  <div className="mt-4 space-y-3">
                    {statsLoading ? (
                      <p className="text-sm text-slate-400">Searching...</p>
                    ) : filteredAttendees.length === 0 ? (
                      <p className="text-sm text-slate-400">
                        No attendees found.
                      </p>
                    ) : (
                      filteredAttendees.map((attendee) => (
                        <div
                          key={attendee.id}
                          className="flex items-center justify-between gap-3 rounded-lg border border-slate-700 bg-slate-900 p-4"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold">
                              {attendee.firstName} {attendee.lastName}
                            </p>

                            <p className="truncate text-sm text-slate-400">
                              {attendee.email}
                            </p>
                          </div>

                          <div className="flex shrink-0 flex-col items-end gap-2">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-medium ${
                                attendee.checkedInAt
                                  ? "bg-green-950 text-green-400"
                                  : "bg-yellow-950 text-yellow-400"
                              }`}
                            >
                              {attendee.checkedInAt ? "Checked In" : "Expected"}
                            </span>

                            {!attendee.checkedInAt && (
                              <button
                                type="button"
                                onClick={() =>
                                  void handleManualCheckIn(attendee)
                                }
                                disabled={
                                  loading ||
                                  checkingInAttendeeId !== null ||
                                  !attendee.registrationToken
                                }
                                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {checkingInAttendeeId === attendee.id
                                  ? "Checking..."
                                  : "Check In"}
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
            {result && (
              <div
                role="status"
                aria-live="polite"
                className={`fixed right-6 top-6 z-50 w-[min(420px,calc(100vw-3rem))] rounded-xl border p-5 shadow-2xl ${
                  result.status === "ACCESS_GRANTED"
                    ? "border-green-500 bg-green-950 text-green-100"
                    : result.status === "ALREADY_CHECKED_IN"
                      ? "border-yellow-500 bg-yellow-950 text-yellow-100"
                      : "border-red-500 bg-red-950 text-red-100"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl" aria-hidden="true">
                    {result.status === "ACCESS_GRANTED"
                      ? "✓"
                      : result.status === "ALREADY_CHECKED_IN"
                        ? "!"
                        : "✕"}
                  </span>

                  <div>
                    <h2 className="text-lg font-bold">
                      {result.status.replaceAll("_", " ")}
                    </h2>

                    <p className="mt-1 text-sm">{result.message}</p>

                    {result.attendeeName && (
                      <p className="mt-2 text-sm font-semibold">
                        {result.attendeeName}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-6 rounded-xl border border-red-700 bg-red-950 p-5 text-red-300">
                {error}
              </div>
            )}
          </section>

          <aside className="min-w-0 rounded-xl border border-slate-700 bg-slate-950/40 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Recent Check-ins</h2>

              <Link
                href={
                  selectedEventId !== null
                    ? `/reception/history?eventId=${selectedEventId}`
                    : "/reception/history"
                }
                className="text-sm font-semibold text-blue-400 transition hover:text-blue-300"
              >
                View All History →
              </Link>
            </div>

            {recentCheckIns.length === 0 ? (
              <p className="mt-4 text-sm text-slate-400">No check-ins yet.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {recentCheckIns.map((attendee) => (
                  <div
                    key={attendee.id}
                    className="flex items-center justify-between rounded-lg bg-slate-950 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium">
                        {attendee.firstName} {attendee.lastName}
                      </p>
                      <p className="text-xs text-green-400">Checked In</p>
                    </div>

                    <span className="text-sm text-slate-400">
                      {attendee.checkedInAt
                        ? new Date(attendee.checkedInAt).toLocaleTimeString(
                            "en-CA",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )
                        : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
