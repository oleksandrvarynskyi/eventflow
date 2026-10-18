"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
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
    async function loadEvents() {
      try {
        const response = await fetch("http://localhost:4000/api/events", {
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
        `http://localhost:4000/api/events/${selectedEventId}/attendees`,
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
        `http://localhost:4000/api/events/${selectedEventId}/check-in`,
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
      setResult(data);

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
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white md:px-8">
      <div className="mx-auto w-full max-w-[1600px] rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl md:p-8">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold tracking-widest text-blue-400">
            EVENTFLOW
          </p>

          <h1 className="text-3xl font-bold">Reception Dashboard</h1>

          <div className="mt-5">
            <label
              htmlFor="event-select"
              className="mb-2 block text-sm font-medium text-slate-400"
            >
              Select Event
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
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
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

          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-700 bg-slate-950 p-4 text-center">
              <p className="text-xs text-slate-400">Total</p>
              <p className="mt-2 text-2xl font-bold">
                {statsLoading ? "..." : totalAttendees}
              </p>
            </div>

            <div className="rounded-xl border border-green-800 bg-green-950/40 p-4 text-center">
              <p className="text-xs text-green-400">Checked In</p>
              <p className="mt-2 text-2xl font-bold text-green-400">
                {statsLoading ? "..." : checkedIn}
              </p>
            </div>

            <div className="rounded-xl border border-blue-800 bg-blue-950/40 p-4 text-center">
              <p className="text-xs text-blue-400">Expected</p>
              <p className="mt-2 text-2xl font-bold text-blue-400">
                {statsLoading ? "..." : expected}
              </p>
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
                <button
                  type="button"
                  onClick={() => setScannerOpen(!scannerOpen)}
                  className="mt-3 w-full rounded-xl bg-blue-600 px-6 py-4 text-lg font-bold text-white transition hover:bg-blue-500"
                >
                  {scannerOpen ? "Close Scanner" : "Scan QR Code"}
                </button>

                {scannerOpen && (
                  <div className="mx-auto mt-4 w-full max-w-[400px]">
                    <QRScanner
                      onScan={(scannedToken) => {
                        setScannerOpen(false);
                        void handleCheckIn(scannedToken);
                      }}
                    />
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
                className={`mt-6 rounded-xl border p-5 ${
                  result.status === "ACCESS_GRANTED"
                    ? "border-green-700 bg-green-950 text-green-300"
                    : result.status === "ALREADY_CHECKED_IN"
                      ? "border-yellow-700 bg-yellow-950 text-yellow-300"
                      : "border-red-700 bg-red-950 text-red-300"
                }`}
              >
                <h2 className="text-xl font-bold">
                  {result.status.replaceAll("_", " ")}
                </h2>

                <p className="mt-2">{result.message}</p>

                {result.attendeeName && (
                  <p className="mt-2 font-medium">
                    Attendee: {result.attendeeName}
                  </p>
                )}

                {receptionMode === "scanner" && (
                  <button
                    type="button"
                    onClick={() => {
                      setResult(null);
                      setError("");
                      setScannerOpen(true);
                    }}
                    className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-500"
                  >
                    Scan Next Ticket
                  </button>
                )}
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
