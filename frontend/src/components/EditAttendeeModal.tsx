"use client";

import { useState, type FormEvent } from "react";

type Attendee = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
};

type Props = {
  eventId: number;
  attendee: Attendee;
  onClose: () => void;
  onSuccess: () => void;
};

export default function EditAttendeeModal({
  eventId,
  attendee,
  onClose,
  onSuccess,
}: Props) {
  const [firstName, setFirstName] = useState(attendee.firstName);
  const [lastName, setLastName] = useState(attendee.lastName);
  const [email, setEmail] = useState(attendee.email);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/events/${eventId}/attendees/${attendee.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update attendee.");
      }

      onSuccess();
    } catch {
      setError("Unable to save changes. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-attendee-title"
        className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 text-white shadow-2xl"
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 id="edit-attendee-title" className="text-xl font-bold">
            Edit Attendee
          </h2>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close dialog"
            className="text-2xl text-slate-400 hover:text-white disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="edit-first-name"
              className="mb-2 block text-sm text-slate-400"
            >
              First Name
            </label>

            <input
              id="edit-first-name"
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="edit-last-name"
              className="mb-2 block text-sm text-slate-400"
            >
              Last Name
            </label>

            <input
              id="edit-last-name"
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="edit-email"
              className="mb-2 block text-sm text-slate-400"
            >
              Email
            </label>

            <input
              id="edit-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-slate-700 px-5 py-3 text-sm font-semibold hover:bg-slate-800 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold hover:bg-blue-500 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
