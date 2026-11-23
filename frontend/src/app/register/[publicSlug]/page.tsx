"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";

type PublicEvent = {
  id: number;
  name: string;
  description: string | null;
  location: string | null;
  startsAt: string;
  endsAt: string | null;
};

export default function RegistrationPage() {
  const params = useParams<{ publicSlug: string }>();
  const publicSlug = params.publicSlug;

  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadEvent() {
      try {
        const response = await fetch(`/api/public/events/${publicSlug}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Event not found");
        }

        const data: PublicEvent = await response.json();
        setEvent(data);
      } catch {
        setLoadError("This event could not be found.");
      } finally {
        setLoading(false);
      }
    }

    void loadEvent();
  }, [publicSlug]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (submitting) return;

    setSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch(
        `/api/public/events/${publicSlug}/register`,
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      setSuccess(true);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Registration failed",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const formattedDate = event
    ? new Intl.DateTimeFormat("en-CA", {
        dateStyle: "full",
        timeStyle: "short",
        timeZone: "America/Edmonton",
      }).format(new Date(event.startsAt))
    : "";

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12 text-white">
      <div className="mx-auto max-w-xl">
        {/* HEADER */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-blue-400">
            EventFlow
          </h1>
          <p className="mt-2 text-sm text-slate-400">Event Registration</p>
        </div>

        {loading && (
          <p className="text-center text-slate-400">Loading event...</p>
        )}

        {!loading && loadError && (
          <div className="rounded-2xl border border-red-800 bg-slate-900 p-8 text-center">
            <h2 className="text-xl font-semibold">Event unavailable</h2>
            <p className="mt-3 text-slate-400">{loadError}</p>
          </div>
        )}

        {!loading && event && (
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
            {/* EVENT DETAILS */}
            <div className="border-b border-slate-800 p-8">
              <h2 className="text-2xl font-bold">{event.name}</h2>

              {event.description && (
                <p className="mt-4 whitespace-pre-line text-slate-300">
                  {event.description}
                </p>
              )}

              <div className="mt-6 space-y-3 text-sm text-slate-300">
                <p>📅 {formattedDate} (Calgary time)</p>

                {event.location && <p>📍 {event.location}</p>}
              </div>
            </div>

            {/* SUCCESS */}
            {success ? (
              <div className="p-8 text-center">
                <div className="mb-4 text-5xl">✓</div>

                <h3 className="text-2xl font-bold text-emerald-400">
                  Registration Successful!
                </h3>

                <p className="mt-4 text-slate-300">
                  Your registration has been confirmed.
                </p>

                <p className="mt-2 text-slate-400">
                  Please check your email for your QR ticket.
                </p>
              </div>
            ) : (
              /* REGISTRATION FORM */
              <form onSubmit={handleSubmit} className="space-y-5 p-8">
                <h3 className="text-xl font-semibold">
                  Register for this event
                </h3>

                <div>
                  <label
                    htmlFor="firstName"
                    className="mb-2 block text-sm text-slate-300"
                  >
                    First Name
                  </label>

                  <input
                    id="firstName"
                    type="text"
                    required
                    maxLength={100}
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="lastName"
                    className="mb-2 block text-sm text-slate-300"
                  >
                    Last Name
                  </label>

                  <input
                    id="lastName"
                    type="text"
                    required
                    maxLength={100}
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm text-slate-300"
                  >
                    Email
                  </label>

                  <input
                    id="email"
                    type="email"
                    required
                    maxLength={254}
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500"
                  />
                </div>

                {submitError && (
                  <p role="alert" className="text-sm text-red-400">
                    {submitError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold transition hover:bg-blue-500 disabled:opacity-50"
                >
                  {submitting ? "Registering..." : "Register Now"}
                </button>
              </form>
            )}
          </div>
        )}

        <p className="mt-8 text-center text-xs text-slate-500">
          Powered by EventFlow
        </p>
      </div>
    </main>
  );
}
