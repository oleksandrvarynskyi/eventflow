"use client";

import { useCallback, useEffect, useState } from "react";
import AddAttendeeForm from "@/components/AddAttendeeForm";
import EditAttendeeModal from "@/components/EditAttendeeModal";
import LogoutButton from "@/components/LogoutButton";

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

type Tab = "registrations" | "attendance";

export default function AdminDashboard() {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [eventsLoading, setEventsLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<Tab>("registrations");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [editingAttendee, setEditingAttendee] = useState<Attendee | null>(null);

  const [deletingAttendee, setDeletingAttendee] = useState<Attendee | null>(
    null,
  );
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Load events
  useEffect(() => {
    async function loadEvents() {
      try {
        const response = await fetch("/api/admin/events", {
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

  // Load attendees
  const loadAttendees = useCallback(async () => {
    if (selectedEventId === null) return;

    setStatsLoading(true);

    try {
      const response = await fetch(
        `/api/admin/events/${selectedEventId}/attendees`,
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

  async function handleDeleteAttendee() {
    if (!deletingAttendee || selectedEventId === null || deleteLoading) {
      return;
    }

    setDeleteLoading(true);
    setDeleteError("");

    try {
      const response = await fetch(
        `/api/admin/events/${selectedEventId}/attendees/${deletingAttendee.id}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete attendee");
      }

      setDeletingAttendee(null);
      await loadAttendees();
    } catch {
      setDeleteError("Unable to delete attendee. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  }

  // Statistics
  const totalAttendees = attendees.length;

  const checkedIn = attendees.filter(
    (attendee) => attendee.checkedInAt !== null,
  ).length;

  const expected = totalAttendees - checkedIn;

  // Search
  const filteredAttendees = attendees
    .filter((attendee) => {
      const query = search.trim().toLowerCase();

      return (
        attendee.firstName.toLowerCase().includes(query) ||
        attendee.lastName.toLowerCase().includes(query) ||
        attendee.email.toLowerCase().includes(query) ||
        `${attendee.firstName} ${attendee.lastName}`
          .toLowerCase()
          .includes(query)
      );
    })
    .sort((a, b) => a.id - b.id);

  // Recent check-ins
  const recentCheckIns = attendees
    .filter((attendee) => attendee.checkedInAt !== null)
    .sort(
      (a, b) =>
        new Date(b.checkedInAt!).getTime() - new Date(a.checkedInAt!).getTime(),
    )
    .slice(0, 10);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white md:px-8">
      <div className="mx-auto w-full max-w-[1600px]">
        {/* HEADER */}
        {/* HEADER */}
        <header className="mb-8 flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="mb-2 text-sm font-semibold tracking-widest text-blue-400">
              EVENTFLOW
            </p>

            <h1 className="text-3xl font-bold">Admin Dashboard</h1>

            <p className="mt-2 text-sm text-slate-400">
              Manage event registrations and attendance.
            </p>
          </div>

          <div className="flex items-center gap-4 pt-1">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-sm font-semibold text-blue-400">
                A
              </span>

              <span className="text-sm font-medium text-slate-300">admin</span>
            </div>

            <LogoutButton />
          </div>
        </header>

        {/* EVENT SELECT */}
        <div className="mb-8 rounded-xl border border-slate-800 bg-slate-900 p-5">
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
              setSearch("");
              setAddModalOpen(false);
              setEditingAttendee(null);
              setDeletingAttendee(null);
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

        {/* TABS */}
        <div className="mb-6 flex gap-6 border-b border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab("registrations")}
            className={`border-b-2 pb-4 text-sm font-semibold transition ${
              activeTab === "registrations"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            Registrations
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("attendance")}
            className={`border-b-2 pb-4 text-sm font-semibold transition ${
              activeTab === "attendance"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            Attendance Statistics
          </button>
        </div>

        {/* REGISTRATIONS TAB */}
        {activeTab === "registrations" && (
          <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Registrations</h2>

                <p className="mt-1 text-sm text-slate-400">
                  {statsLoading
                    ? "Loading attendees..."
                    : `${filteredAttendees.length} of ${totalAttendees} attendees`}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setAddModalOpen(true)}
                disabled={selectedEventId === null}
                className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold transition hover:bg-blue-500 disabled:opacity-50"
              >
                + Add Attendee
              </button>
            </div>

            {/* SEARCH */}
            <input
              type="search"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-5 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-blue-500"
            />

            {/* TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="border-b border-slate-700 text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">ID</th>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredAttendees.map((attendee) => (
                    <tr
                      key={attendee.id}
                      className="border-b border-slate-800 transition hover:bg-slate-800/50"
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

                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            attendee.checkedInAt
                              ? "bg-green-950 text-green-400"
                              : "bg-yellow-950 text-yellow-400"
                          }`}
                        >
                          {attendee.checkedInAt ? "Checked In" : "Expected"}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setEditingAttendee(attendee)}
                          className="mr-4 font-medium text-blue-400 transition hover:text-blue-300"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setDeletingAttendee(attendee);
                            setDeleteError("");
                          }}
                          className="font-medium text-red-400 transition hover:text-red-300"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!statsLoading && filteredAttendees.length === 0 && (
                <p className="py-8 text-center text-sm text-slate-400">
                  No attendees found.
                </p>
              )}
            </div>
          </section>
        )}

        {/* ATTENDANCE TAB */}
        {activeTab === "attendance" && (
          <section>
            <h2 className="mb-6 text-xl font-semibold">
              Attendance Statistics
            </h2>

            {/* STATISTICS */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                <p className="text-sm text-slate-400">Total Registered</p>
                <p className="mt-3 text-3xl font-bold">
                  {statsLoading ? "..." : totalAttendees}
                </p>
              </div>

              <div className="rounded-xl border border-green-900 bg-green-950/30 p-6">
                <p className="text-sm text-green-400">Checked In</p>
                <p className="mt-3 text-3xl font-bold text-green-400">
                  {statsLoading ? "..." : checkedIn}
                </p>
              </div>

              <div className="rounded-xl border border-blue-900 bg-blue-950/30 p-6">
                <p className="text-sm text-blue-400">Expected</p>
                <p className="mt-3 text-3xl font-bold text-blue-400">
                  {statsLoading ? "..." : expected}
                </p>
              </div>
            </div>

            {/* RECENT CHECK-INS */}
            <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-5">
              <h3 className="mb-5 text-lg font-semibold">Recent Check-ins</h3>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px] text-left text-sm">
                  <thead className="border-b border-slate-700 text-slate-400">
                    <tr>
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Check-in Time</th>
                    </tr>
                  </thead>

                  <tbody>
                    {recentCheckIns.map((attendee) => (
                      <tr
                        key={attendee.id}
                        className="border-b border-slate-800"
                      >
                        <td className="px-4 py-4">
                          {attendee.firstName} {attendee.lastName}
                        </td>

                        <td className="px-4 py-4 text-slate-400">
                          {attendee.email}
                        </td>

                        <td className="px-4 py-4 text-slate-400">
                          {attendee.checkedInAt
                            ? new Date(attendee.checkedInAt).toLocaleString(
                                "en-CA",
                              )
                            : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {!statsLoading && recentCheckIns.length === 0 && (
                  <p className="py-8 text-center text-sm text-slate-400">
                    No check-ins yet.
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ADD ATTENDEE MODAL */}
        {addModalOpen && selectedEventId !== null && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                setAddModalOpen(false);
              }
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="add-attendee-title"
              className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h2 id="add-attendee-title" className="text-xl font-bold">
                  Add Attendee
                </h2>

                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  aria-label="Close dialog"
                  className="text-2xl text-slate-400 hover:text-white"
                >
                  ×
                </button>
              </div>

              <AddAttendeeForm
                key={selectedEventId}
                eventId={selectedEventId}
                onSuccess={() => {
                  void loadAttendees();
                  setAddModalOpen(false);
                }}
              />
            </div>
          </div>
        )}
        {/* EDIT ATTENDEE MODAL */}
        {editingAttendee && selectedEventId !== null && (
          <EditAttendeeModal
            key={editingAttendee.id}
            eventId={selectedEventId}
            attendee={editingAttendee}
            onClose={() => setEditingAttendee(null)}
            onSuccess={() => {
              setEditingAttendee(null);
              void loadAttendees();
            }}
          />
        )}
        {/* DELETE ATTENDEE MODAL */}
        {deletingAttendee && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget && !deleteLoading) {
                setDeletingAttendee(null);
              }
            }}
          >
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="delete-attendee-title"
              aria-describedby="delete-attendee-description"
              className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
            >
              <h2
                id="delete-attendee-title"
                className="text-xl font-bold text-white"
              >
                Delete Attendee?
              </h2>

              <p
                id="delete-attendee-description"
                className="mt-4 text-sm leading-6 text-slate-400"
              >
                Are you sure you want to delete{" "}
                <span className="font-semibold text-white">
                  {deletingAttendee.firstName} {deletingAttendee.lastName}
                </span>
                ?
                <br />
                <br />
                This will permanently remove their registration and invalidate
                their QR ticket. This action cannot be undone.
              </p>

              {deleteError && (
                <p className="mt-4 text-sm text-red-400">{deleteError}</p>
              )}

              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeletingAttendee(null)}
                  disabled={deleteLoading}
                  className="rounded-lg border border-slate-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => void handleDeleteAttendee()}
                  disabled={deleteLoading}
                  className="rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
                >
                  {deleteLoading ? "Deleting..." : "Delete Attendee"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
