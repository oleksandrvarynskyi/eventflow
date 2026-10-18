"use client";

import { useState } from "react";

type AddAttendeeFormProps = {
  eventId: number;
  onSuccess: () => void;
};

export default function AddAttendeeForm({
  eventId,
  onSuccess,
}: AddAttendeeFormProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `http://localhost:4000/api/events/${eventId}/attendees`,
        {
          method: "POST",
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
        throw new Error("Failed to register attendee");
      }

      setSuccess("Attendee registered successfully!");

      setFirstName("");
      setLastName("");
      setEmail("");

      onSuccess();
    } catch {
      setError("Unable to register attendee. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 rounded-xl border border-slate-700 bg-slate-950 p-5"
    >
      <h2 className="mb-4 text-lg font-semibold">Add Attendee</h2>

      <div className="space-y-3">
        <input
          type="text"
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
          maxLength={100}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-blue-500"
        />

        <input
          type="text"
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
          maxLength={100}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-blue-500"
        />

        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-4 w-full rounded-lg bg-green-600 px-4 py-3 font-semibold transition hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Registering..." : "Register Attendee"}
      </button>

      {success && <p className="mt-3 text-sm text-green-400">{success}</p>}

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
    </form>
  );
}
