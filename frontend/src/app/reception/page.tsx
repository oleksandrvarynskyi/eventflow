"use client";

import { useCallback, useEffect, useState } from "react";
import QRScanner from "@/components/QRScanner";

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
  checkedInAt: string | null;
};

type Event = {
  id: number;
  name: string;
  location: string | null;
  startsAt: string;
};

export default function Home() {
  const [token, setToken] = useState("");
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
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
          setSelectedEventId(data[0].id);
        }
      } catch (error) {
        console.error("Failed to load events:", error);
      } finally {
        setEventsLoading(false);
      }
    }

    void loadEvents();
  }, []);
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

  const recentCheckIns = attendees
    .filter((attendee) => attendee.checkedInAt !== null)
    .sort(
      (a, b) =>
        new Date(b.checkedInAt!).getTime() - new Date(a.checkedInAt!).getTime(),
    )
    .slice(0, 5);

  async function handleCheckIn(scannedToken?: string) {
    const ticketToken = scannedToken ?? token;

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

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
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
                setToken("");
                setScannerOpen(false);
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

        <label
          htmlFor="ticket-token"
          className="mb-2 block text-sm font-medium"
        >
          Ticket Token
        </label>

        <input
          id="ticket-token"
          type="text"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          placeholder="Enter registration token"
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
        />

        <button
          onClick={() => void handleCheckIn()}
          disabled={loading || !token.trim()}
          className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Checking..." : "Check In"}
        </button>
        <button
          type="button"
          onClick={() => setScannerOpen(!scannerOpen)}
          className="mt-3 w-full rounded-lg border border-slate-600 px-4 py-3 font-semibold transition hover:bg-slate-800"
        >
          {scannerOpen ? "Close Scanner" : "Scan QR Code"}
        </button>

        {scannerOpen && (
          <QRScanner
            onScan={(scannedToken) => {
              setScannerOpen(false);
              setToken(scannedToken);
              void handleCheckIn(scannedToken);
            }}
          />
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
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-xl border border-red-700 bg-red-950 p-5 text-red-300">
            {error}
          </div>
        )}

        <div className="mt-8 border-t border-slate-700 pt-6">
          <h2 className="text-lg font-semibold">Recent Check-ins</h2>

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
        </div>
      </div>
    </main>
  );
}
