"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export type EventItem = {
  id: number;
  name: string;
  description: string | null;
  location: string | null;
  startsAt: string;
  endsAt: string | null;
};

type EventStatus = "upcoming" | "ongoing" | "completed";
type StatusFilter = "all" | EventStatus;
type SortOption = "nearest" | "farthest" | "name-asc" | "name-desc";

type Props = {
  events: EventItem[];
  search: string;
  onSearchChange: (value: string) => void;
  mode?: "admin" | "organizer";
  onEdit?: (event: EventItem) => void;
};

const PAGE_SIZE = 10;

function getEventStatus(event: EventItem, now: number): EventStatus {
  const start = new Date(event.startsAt).getTime();

  if (now < start) {
    return "upcoming";
  }

  // Events without an end date are treated as completed
  // once their start time has passed.
  if (!event.endsAt) {
    return "completed";
  }

  const end = new Date(event.endsAt).getTime();

  return now < end ? "ongoing" : "completed";
}

const statusStyles: Record<EventStatus, string> = {
  upcoming: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  ongoing: "bg-green-500/10 text-green-400 border-green-500/30",
  completed: "bg-slate-500/10 text-slate-400 border-slate-500/30",
};

export default function EventsTable({
  events,
  search,
  onSearchChange,
  mode = "admin",
  onEdit,
}: Props) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("nearest");
  const [page, setPage] = useState(1);
  const [now, setNow] = useState(() => Date.now());

  // Refresh statuses every minute.
  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 60_000);

    return () => window.clearInterval(interval);
  }, []);

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return events
      .filter((event) => {
        const matchesSearch =
          event.name.toLowerCase().includes(query) ||
          (event.description ?? "").toLowerCase().includes(query) ||
          (event.location ?? "").toLowerCase().includes(query);

        const matchesStatus =
          statusFilter === "all" || getEventStatus(event, now) === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "nearest":
            return (
              new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
            );

          case "farthest":
            return (
              new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime()
            );

          case "name-asc":
            return a.name.localeCompare(b.name);

          case "name-desc":
            return b.name.localeCompare(a.name);

          default:
            return 0;
        }
      });
  }, [events, search, statusFilter, sortBy, now]);

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE));

  const currentPage = Math.min(page, totalPages);

  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  // Reset pagination when filters change.
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, sortBy]);

  const startItem =
    filteredEvents.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;

  const endItem = Math.min(currentPage * PAGE_SIZE, filteredEvents.length);

  return (
    <div>
      {/* SEARCH + FILTERS + SORT */}
      <div className="mb-5 flex flex-col gap-3 lg:flex-row">
        {/* SEARCH */}
        <input
          type="search"
          placeholder="Search events..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
        />

        {/* STATUS FILTER */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 lg:w-48"
        >
          <option value="all">All Statuses</option>
          <option value="upcoming">Upcoming</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
        </select>

        {/* SORT */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 lg:w-56"
        >
          <option value="nearest">Date: Oldest First</option>
          <option value="farthest">Date: Newest First</option>
          <option value="name-asc">Name: A–Z</option>
          <option value="name-desc">Name: Z–A</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-slate-700 text-slate-400">
            <tr>
              <th className="px-5 py-4 font-medium">Event</th>
              <th className="px-5 py-4 font-medium">Date</th>
              <th className="px-5 py-4 font-medium">Location</th>
              <th className="px-5 py-4 font-medium">Status</th>
              {mode === "admin" && (
                <th className="px-5 py-4 text-right font-medium">Actions</th>
              )}
            </tr>
          </thead>

          <tbody>
            {paginatedEvents.map((event) => {
              const status = getEventStatus(event, now);

              return (
                <tr
                  key={event.id}
                  className="border-b border-slate-800 transition hover:bg-slate-800/50"
                >
                  <td className="px-5 py-4">
                    <Link
                      href={`/${mode}/events/${event.id}`}
                      className="font-semibold text-white hover:text-blue-400"
                    >
                      {event.name}
                    </Link>

                    {event.description && (
                      <p className="mt-1 max-w-md truncate text-xs text-slate-400">
                        {event.description}
                      </p>
                    )}
                  </td>

                  <td className="px-5 py-4 text-slate-300">
                    {new Date(event.startsAt).toLocaleString("en-CA", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>

                  <td className="px-5 py-4 text-slate-300">
                    {event.location || "—"}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium capitalize ${statusStyles[status]}`}
                    >
                      {status}
                    </span>
                  </td>

                  {mode === "admin" && onEdit && (
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => onEdit(event)}
                        className="font-medium text-blue-400 hover:text-blue-300"
                      >
                        Edit
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>

        {paginatedEvents.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-400">
            No events found.
          </p>
        )}
      </div>

      {/* PAGINATION */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-slate-400">
          Showing {startItem}–{endItem} of {filteredEvents.length} events
        </p>

        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-800"
            >
              Previous
            </button>

            <span className="px-3 text-sm text-slate-300">
              {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setPage(currentPage + 1)}
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-800"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
