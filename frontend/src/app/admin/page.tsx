"use client";

import { useCallback, useEffect, useState } from "react";
import AddAttendeeForm from "@/components/AddAttendeeForm";
import EditAttendeeModal from "@/components/EditAttendeeModal";
import EventsTable from "@/components/EventsTable";

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
  description: string | null;
  location: string | null;
  startsAt: string;
  endsAt: string | null;
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

  const [editEventOpen, setEditEventOpen] = useState(false);
  const [updatingEvent, setUpdatingEvent] = useState(false);
  const [editEventError, setEditEventError] = useState("");

  const [eventSearch, setEventSearch] = useState("");

  const [editEventForm, setEditEventForm] = useState({
    name: "",
    description: "",
    location: "",
    startsAt: "",
    endsAt: "",
  });

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

  function openEditEvent() {
    const event = events.find((item) => item.id === selectedEventId);

    if (!event) return;

    const toLocalDateTime = (value: string | null) => {
      if (!value) return "";

      const date = new Date(value);

      const offset = date.getTimezoneOffset() * 60_000;

      return new Date(date.getTime() - offset).toISOString().slice(0, 16);
    };

    setEditEventForm({
      name: event.name,
      description: event.description ?? "",
      location: event.location ?? "",
      startsAt: toLocalDateTime(event.startsAt),
      endsAt: toLocalDateTime(event.endsAt),
    });

    setEditEventError("");
    setEditEventOpen(true);
  }

  async function handleUpdateEvent(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (updatingEvent || selectedEventId === null) return;

    setUpdatingEvent(true);
    setEditEventError("");

    try {
      const name = editEventForm.name.trim();

      if (name.length < 3 || name.length > 150) {
        throw new Error("Event name must contain 3–150 characters.");
      }

      if (!editEventForm.startsAt) {
        throw new Error("Start date is required.");
      }

      const startsAt = new Date(editEventForm.startsAt);

      if (Number.isNaN(startsAt.getTime())) {
        throw new Error("Invalid start date.");
      }

      let endsAt: Date | null = null;

      if (editEventForm.endsAt) {
        endsAt = new Date(editEventForm.endsAt);

        if (Number.isNaN(endsAt.getTime())) {
          throw new Error("Invalid end date.");
        }

        if (endsAt <= startsAt) {
          throw new Error("End date must be later than start date.");
        }
      }

      const response = await fetch(`/api/admin/events/${selectedEventId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description: editEventForm.description.trim(),
          location: editEventForm.location.trim(),
          startsAt: startsAt.toISOString(),
          endsAt: endsAt?.toISOString() ?? null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update event.");
      }

      const updatedEvent = data as Event;

      setEvents((previous) =>
        previous.map((event) =>
          event.id === updatedEvent.id ? updatedEvent : event,
        ),
      );

      setEditEventOpen(false);
    } catch (error) {
      setEditEventError(
        error instanceof Error ? error.message : "Unable to update event.",
      );
    } finally {
      setUpdatingEvent(false);
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

  function toLocalDateTime(value: string | null) {
    if (!value) return "";

    const date = new Date(value);
    const offset = date.getTimezoneOffset() * 60_000;

    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white md:px-8">
      <div className="mx-auto w-full max-w-[1600px]">
        {/* EVENTS TABLE */}
        <section className="mb-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Events</h1>
            </div>

            <button
              type="button"
              onClick={() => {
                setCreateEventError("");
                setCreateEventOpen(true);
              }}
              className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold transition hover:bg-blue-500"
            >
              + Create Event
            </button>
          </div>

          {eventsLoading ? (
            <p className="text-sm text-slate-400">Loading events...</p>
          ) : (
            <EventsTable
              events={events}
              search={eventSearch}
              onSearchChange={setEventSearch}
              onEdit={(event) => {
                setSelectedEventId(event.id);
                setEditEventForm({
                  name: event.name,
                  description: event.description ?? "",
                  location: event.location ?? "",
                  startsAt: toLocalDateTime(event.startsAt),
                  endsAt: toLocalDateTime(event.endsAt),
                });
                setEditEventError("");
                setEditEventOpen(true);
              }}
            />
          )}
        </section>

        {/* EDIT EVENT MODAL */}
        {editEventOpen && selectedEventId !== null && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget && !updatingEvent) {
                setEditEventOpen(false);
              }
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-event-title"
              className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 id="edit-event-title" className="text-xl font-bold">
                  Edit Event
                </h2>

                <button
                  type="button"
                  onClick={() => setEditEventOpen(false)}
                  disabled={updatingEvent}
                  aria-label="Close dialog"
                  className="text-2xl text-slate-400 hover:text-white disabled:opacity-50"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleUpdateEvent} className="space-y-5">
                {/* EVENT NAME */}
                <div>
                  <label
                    htmlFor="edit-event-name"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Event Name *
                  </label>

                  <input
                    id="edit-event-name"
                    type="text"
                    required
                    minLength={3}
                    maxLength={150}
                    value={editEventForm.name}
                    onChange={(e) =>
                      setEditEventForm((previous) => ({
                        ...previous,
                        name: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                  />
                </div>

                {/* DESCRIPTION */}
                <div>
                  <label
                    htmlFor="edit-event-description"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Description
                  </label>

                  <textarea
                    id="edit-event-description"
                    rows={3}
                    value={editEventForm.description}
                    onChange={(e) =>
                      setEditEventForm((previous) => ({
                        ...previous,
                        description: e.target.value,
                      }))
                    }
                    className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                  />
                </div>

                {/* LOCATION */}
                <div>
                  <label
                    htmlFor="edit-event-location"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Location
                  </label>

                  <input
                    id="edit-event-location"
                    type="text"
                    value={editEventForm.location}
                    onChange={(e) =>
                      setEditEventForm((previous) => ({
                        ...previous,
                        location: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                  />
                </div>

                {/* START DATE */}
                <div>
                  <label
                    htmlFor="edit-event-start"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Start Date & Time *
                  </label>

                  <input
                    id="edit-event-start"
                    type="datetime-local"
                    required
                    value={editEventForm.startsAt}
                    onChange={(e) =>
                      setEditEventForm((previous) => ({
                        ...previous,
                        startsAt: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                  />
                </div>

                {/* END DATE */}
                <div>
                  <label
                    htmlFor="edit-event-end"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    End Date & Time
                  </label>

                  <input
                    id="edit-event-end"
                    type="datetime-local"
                    min={editEventForm.startsAt || undefined}
                    value={editEventForm.endsAt}
                    onChange={(e) =>
                      setEditEventForm((previous) => ({
                        ...previous,
                        endsAt: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                  />
                </div>

                {/* ERROR */}
                {editEventError && (
                  <p role="alert" className="text-sm text-red-400">
                    {editEventError}
                  </p>
                )}

                {/* ACTIONS */}
                <div className="flex justify-end gap-3 border-t border-slate-800 pt-5">
                  <button
                    type="button"
                    onClick={() => setEditEventOpen(false)}
                    disabled={updatingEvent}
                    className="rounded-lg border border-slate-700 px-5 py-3 text-sm font-semibold transition hover:bg-slate-800 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={updatingEvent}
                    className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold transition hover:bg-blue-500 disabled:opacity-50"
                  >
                    {updatingEvent ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
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
      </div>
    </main>
  );
}
