"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

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
};

export default function CheckInHistoryPage() {
  const searchParams = useSearchParams();
  const eventIdParam = searchParams.get("eventId");
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 10;

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
        } else {
          setLoading(false);
        }
      } catch {
        setError("Unable to load events.");
        setLoading(false);
      }
    }

    void loadEvents();
  }, [eventIdParam]);

  useEffect(() => {
    if (selectedEventId === null) return;

    let cancelled = false;

    async function loadHistory() {
      setLoading(true);
      setError("");
      setAttendees([]);

      try {
        const response = await fetch(
          `/api/reception/events/${selectedEventId}/attendees`,
          { cache: "no-store" },
        );

        if (!response.ok) {
          throw new Error("Failed to load attendees");
        }

        const data: Attendee[] = await response.json();

        if (!cancelled) {
          setAttendees(data);
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load check-in history.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadHistory();

    return () => {
      cancelled = true;
    };
  }, [selectedEventId]);

  const checkInHistory = attendees
    .filter((attendee) => attendee.checkedInAt !== null)
    .sort(
      (a, b) =>
        new Date(b.checkedInAt!).getTime() - new Date(a.checkedInAt!).getTime(),
    );

  const filteredHistory = checkInHistory.filter((attendee) => {
    const query = search.trim().toLowerCase();

    if (!query) return true;

    const fullName = `${attendee.firstName} ${attendee.lastName}`.toLowerCase();

    return (
      attendee.firstName.toLowerCase().includes(query) ||
      attendee.lastName.toLowerCase().includes(query) ||
      attendee.email.toLowerCase().includes(query) ||
      fullName.includes(query)
    );
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredHistory.length / ITEMS_PER_PAGE),
  );

  const paginatedHistory = filteredHistory.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  function handleExportCSV() {
    if (checkInHistory.length === 0 || selectedEventId === null) {
      return;
    }

    const headers = ["ID", "First Name", "Last Name", "Email", "Check-in Time"];

    const escapeCSV = (value: string | number) => {
      const text = String(value);

      // Prevent spreadsheet formula injection.
      const safeText = /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text;

      return `"${safeText.replace(/"/g, '""')}"`;
    };

    const rows = checkInHistory.map((attendee) => [
      attendee.id,
      attendee.firstName,
      attendee.lastName,
      attendee.email,
      attendee.checkedInAt
        ? new Date(attendee.checkedInAt).toLocaleString("en-CA", {
            dateStyle: "medium",
            timeStyle: "short",
          })
        : "",
    ]);

    const csvContent = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\r\n");

    const blob = new Blob(["\uFEFF", csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `eventflow-checkins-event-${selectedEventId}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white md:px-8">
      <div className="mx-auto w-full max-w-[1400px]">
        <Link
          href={
            selectedEventId !== null
              ? `/reception?eventId=${selectedEventId}`
              : "/reception"
          }
          className="text-sm font-medium text-blue-400 hover:text-blue-300"
        >
          ← Back to Reception
        </Link>

        <div className="mt-8">
          <p className="text-sm font-semibold tracking-widest text-blue-400">
            EVENTFLOW
          </p>

          <h1 className="mt-2 text-3xl font-bold">Check-in History</h1>

          <p className="mt-3 text-slate-400">
            View all attendees who have checked in to an event.
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <label
            htmlFor="history-event-select"
            className="mb-2 block text-sm font-medium text-slate-400"
          >
            Select Event
          </label>

          <select
            id="history-event-select"
            value={selectedEventId ?? ""}
            onChange={(e) => {
              setSelectedEventId(Number(e.target.value));
              setSearch("");
              setCurrentPage(1);
            }}
            disabled={events.length === 0}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
          >
            {events.length === 0 ? (
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

        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="mb-6">
            <label
              htmlFor="history-search"
              className="mb-2 block text-sm font-medium text-slate-400"
            >
              Search Check-in History
            </label>

            <input
              id="history-search"
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by name or email..."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
            />
          </div>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">Check-in Records</h2>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-lg border border-green-800 bg-green-950/40 px-4 py-2 text-sm font-semibold text-green-400">
                Total Check-ins: {loading ? "..." : checkInHistory.length}
              </div>

              <button
                type="button"
                onClick={handleExportCSV}
                disabled={loading || checkInHistory.length === 0}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Export CSV
              </button>
            </div>
          </div>

          {error ? (
            <p className="text-red-400">{error}</p>
          ) : loading ? (
            <p className="text-slate-400">Loading history...</p>
          ) : filteredHistory.length === 0 ? (
            <p className="text-slate-400">
              No check-ins recorded for this event.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400">
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Attendee</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Check-in Time</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedHistory.map((attendee) => (
                    <tr
                      key={attendee.id}
                      className="border-b border-slate-800 last:border-0"
                    >
                      <td className="px-4 py-4 text-slate-400">
                        {attendee.id}
                      </td>

                      <td className="px-4 py-4 font-medium">
                        {attendee.firstName} {attendee.lastName}
                      </td>

                      <td className="px-4 py-4 text-slate-400">
                        {attendee.email}
                      </td>

                      <td className="px-4 py-4 text-green-400">
                        {attendee.checkedInAt
                          ? new Date(attendee.checkedInAt).toLocaleString(
                              "en-CA",
                              {
                                dateStyle: "medium",
                                timeStyle: "short",
                              },
                            )
                          : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredHistory.length > ITEMS_PER_PAGE && (
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-700 pt-5">
                  <p className="text-sm text-slate-400">
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                    {Math.min(
                      currentPage * ITEMS_PER_PAGE,
                      filteredHistory.length,
                    )}{" "}
                    of {filteredHistory.length} records
                  </p>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((page) => Math.max(1, page - 1))
                      }
                      disabled={currentPage === 1}
                      className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Previous
                    </button>

                    <span className="text-sm text-slate-400">
                      Page {currentPage} of {totalPages}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((page) => Math.min(totalPages, page + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
