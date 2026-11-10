"use client";

import { useEffect, useState } from "react";
import EventsTable, { type EventItem } from "@/components/EventsTable";

export default function OrganizerDashboard() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadEvents() {
      try {
        const response = await fetch("/api/organizer/events", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load events");
        }

        const data: EventItem[] = await response.json();
        setEvents(data);
      } catch {
        setError("Unable to load your assigned events.");
      } finally {
        setLoading(false);
      }
    }

    void loadEvents();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Events</h1>

          <p className="mt-2 text-sm text-slate-400">
            View and manage your assigned events.
          </p>
        </div>

        {loading ? (
          <p className="text-slate-400">Loading events...</p>
        ) : error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-red-400">
            {error}
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 px-6 py-16 text-center">
            <h2 className="text-xl font-semibold">No Events Assigned</h2>

            <p className="mt-3 text-sm text-slate-400">
              You don't have any assigned events yet.
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Please contact your administrator to get access to an event.
            </p>
          </div>
        ) : (
          <EventsTable
            events={events}
            search={search}
            onSearchChange={setSearch}
            mode="organizer"
          />
        )}
      </div>
    </main>
  );
}
