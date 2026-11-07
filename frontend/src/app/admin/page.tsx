"use client";

import { useCallback, useEffect, useState } from "react";
import AddAttendeeForm from "@/components/AddAttendeeForm";
import EditAttendeeModal from "@/components/EditAttendeeModal";

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

  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [createEventError, setCreateEventError] = useState("");

  const [createEventForm, setCreateEventForm] = useState({
    name: "",
    description: "",
    location: "",
    startsAt: "",
    endsAt: "",
  });

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

  async function handleCreateEvent(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (creatingEvent) return;

    setCreatingEvent(true);
    setCreateEventError("");

    try {
      const name = createEventForm.name.trim();

      if (name.length < 3 || name.length > 150) {
        throw new Error("Event name must contain 3–150 characters.");
      }

      if (!createEventForm.startsAt) {
        throw new Error("Start date is required.");
      }

      const startsAt = new Date(createEventForm.startsAt);

      if (Number.isNaN(startsAt.getTime())) {
        throw new Error("Invalid start date.");
      }

      let endsAt: Date | null = null;

      if (createEventForm.endsAt) {
        endsAt = new Date(createEventForm.endsAt);

        if (Number.isNaN(endsAt.getTime())) {
          throw new Error("Invalid end date.");
        }

        if (endsAt <= startsAt) {
          throw new Error("End date must be later than start date.");
        }
      }

      const response = await fetch("/api/admin/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description: createEventForm.description.trim(),
          location: createEventForm.location.trim(),
          startsAt: startsAt.toISOString(),
          ...(endsAt ? { endsAt: endsAt.toISOString() } : {}),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create event.");
      }

      const newEvent = data as Event;

      // Add new event to the selector
      setEvents((previous) => [...previous, newEvent]);

      // Automatically select the new event
      setSelectedEventId(newEvent.id);

      // Reset dashboard state
      setSearch("");
      setActiveTab("registrations");
      setAddModalOpen(false);
      setEditingAttendee(null);
      setDeletingAttendee(null);

      // Reset form
      setCreateEventForm({
        name: "",
        description: "",
        location: "",
        startsAt: "",
        endsAt: "",
      });

      setCreateEventOpen(false);
    } catch (error) {
      setCreateEventError(
        error instanceof Error ? error.message : "Unable to create event.",
      );
    } finally {
      setCreatingEvent(false);
    }
  }

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
        {/* PAGE HEADER */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>

          <p className="mt-2 text-sm text-slate-400">
            Manage event registrations and attendance.
          </p>
        </header>

        {/* EVENT SELECT */}
        <div className="mb-8 rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="mb-3 flex items-center justify-between gap-4">
            <label
              htmlFor="event-select"
              className="block text-sm font-medium text-slate-400"
            >
              Select Event
            </label>

            <button
              type="button"
              onClick={() => {
                setCreateEventError("");
                setCreateEventOpen(true);
              }}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              + Create Event
            </button>
          </div>
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

        {/* CREATE EVENT MODAL */}
        {createEventOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget && !creatingEvent) {
                setCreateEventOpen(false);
              }
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="create-event-title"
              className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 id="create-event-title" className="text-xl font-bold">
                  Create Event
                </h2>

                <button
                  type="button"
                  onClick={() => setCreateEventOpen(false)}
                  disabled={creatingEvent}
                  aria-label="Close dialog"
                  className="text-2xl text-slate-400 hover:text-white disabled:opacity-50"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleCreateEvent} className="space-y-5">
                <div>
                  <label
                    htmlFor="event-name"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Event Name *
                  </label>

                  <input
                    id="event-name"
                    type="text"
                    required
                    minLength={3}
                    maxLength={150}
                    value={createEventForm.name}
                    onChange={(e) =>
                      setCreateEventForm((previous) => ({
                        ...previous,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Scientific Conference 2026"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="event-description"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Description
                  </label>

                  <textarea
                    id="event-description"
                    rows={3}
                    value={createEventForm.description}
                    onChange={(e) =>
                      setCreateEventForm((previous) => ({
                        ...previous,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Optional event description"
                    className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="event-location"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Location
                  </label>

                  <input
                    id="event-location"
                    type="text"
                    value={createEventForm.location}
                    onChange={(e) =>
                      setCreateEventForm((previous) => ({
                        ...previous,
                        location: e.target.value,
                      }))
                    }
                    placeholder="Calgary, Alberta"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="event-start"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Start Date & Time *
                  </label>

                  <input
                    id="event-start"
                    type="datetime-local"
                    required
                    value={createEventForm.startsAt}
                    onChange={(e) =>
                      setCreateEventForm((previous) => ({
                        ...previous,
                        startsAt: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="event-end"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    End Date & Time
                  </label>

                  <input
                    id="event-end"
                    type="datetime-local"
                    min={createEventForm.startsAt || undefined}
                    value={createEventForm.endsAt}
                    onChange={(e) =>
                      setCreateEventForm((previous) => ({
                        ...previous,
                        endsAt: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                  />
                </div>

                {createEventError && (
                  <p role="alert" className="text-sm text-red-400">
                    {createEventError}
                  </p>
                )}

                <div className="flex justify-end gap-3 border-t border-slate-800 pt-5">
                  <button
                    type="button"
                    onClick={() => setCreateEventOpen(false)}
                    disabled={creatingEvent}
                    className="rounded-lg border border-slate-700 px-5 py-3 text-sm font-semibold transition hover:bg-slate-800 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={creatingEvent}
                    className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold transition hover:bg-blue-500 disabled:opacity-50"
                  >
                    {creatingEvent ? "Creating..." : "Create Event"}
                  </button>
                </div>
              </form>
            </div>
          </div>
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
