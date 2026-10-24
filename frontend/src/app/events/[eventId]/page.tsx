"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Event = {
  id: number;
  name: string;
  location: string | null;
  startsAt: string;
};

export default function PublicEventPage() {
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [registrationError, setRegistrationError] = useState("");
  const [registered, setRegistered] = useState(false);
  const [registeredAttendeeId, setRegisteredAttendeeId] = useState<
    number | null
  >(null);

  useEffect(() => {
    async function loadEvent() {
      try {
        const response = await fetch("http://localhost:4000/api/events", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load event");
        }

        const events: Event[] = await response.json();

        const selectedEvent = events.find(
          (item) => item.id === Number(eventId),
        );

        if (!selectedEvent) {
          setError("Event not found.");
          return;
        }

        setEvent(selectedEvent);
      } catch {
        setError("Unable to load event information.");
      } finally {
        setLoading(false);
      }
    }

    void loadEvent();
  }, [eventId]);

  async function handleRegistration(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (submitting || registered || !event) return;

    setSubmitting(true);
    setRegistrationError("");

    try {
      const response = await fetch(
        `http://localhost:4000/api/events/${event.id}/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim().toLowerCase(),
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Registration failed");
      }

      const data: {
        success: boolean;
        message: string;
        attendee: {
          id: number;
        };
      } = await response.json();

      setRegisteredAttendeeId(data.attendee.id);
      setRegistered(true);
    } catch (error) {
      console.error("Registration error:", error);
      setRegistrationError(
        "Unable to complete registration. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
        <p className="text-sm font-bold tracking-widest text-blue-400">
          EVENTFLOW
        </p>

        {loading ? (
          <p className="mt-8 text-slate-400">Loading event...</p>
        ) : error ? (
          <p className="mt-8 text-red-400">{error}</p>
        ) : event ? (
          <>
            <h1 className="mt-6 text-3xl font-bold">{event.name}</h1>

            <div className="mt-6 space-y-3 text-slate-300">
              <p>
                <span className="font-semibold text-white">Date: </span>
                {new Date(event.startsAt).toLocaleString("en-CA", {
                  dateStyle: "long",
                  timeStyle: "short",
                })}
              </p>

              <p>
                <span className="font-semibold text-white">Location: </span>
                {event.location || "To be announced"}
              </p>
            </div>

            {registered ? (
              <div className="mt-8 rounded-xl border border-green-700 bg-green-950/40 p-6 text-center">
                <div className="text-4xl text-green-400">✓</div>

                <h2 className="mt-3 text-2xl font-bold text-green-300">
                  Registration Successful!
                </h2>

                <p className="mt-3 text-slate-300">
                  Thank you, {firstName}! You are registered for {event.name}.
                </p>

                {registeredAttendeeId !== null && event && (
                  <div className="mt-6 flex flex-col items-center">
                    <div className="rounded-xl bg-white p-4">
                      <img
                        src={`http://localhost:4000/api/events/${event.id}/attendees/${registeredAttendeeId}/qr`}
                        alt="Your event QR ticket"
                        width={240}
                        height={240}
                        className="h-60 w-60"
                      />
                    </div>

                    <p className="mt-4 text-sm text-slate-300">
                      Present this QR code at the event entrance.
                    </p>

                    <p className="mt-2 text-xs text-slate-400">
                      Keep this page open or save a screenshot of your ticket.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <form
                onSubmit={handleRegistration}
                className="mt-8 space-y-5 border-t border-slate-700 pt-6"
              >
                <div>
                  <h2 className="text-xl font-semibold">Event Registration</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Fill in your details to register for this event.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="mb-2 block text-sm font-medium text-slate-300"
                    >
                      First Name
                    </label>

                    <input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      maxLength={100}
                      autoComplete="given-name"
                      placeholder="John"
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="lastName"
                      className="mb-2 block text-sm font-medium text-slate-300"
                    >
                      Last Name
                    </label>

                    <input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      maxLength={100}
                      autoComplete="family-name"
                      placeholder="Smith"
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Email Address
                  </label>

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    maxLength={254}
                    autoComplete="email"
                    placeholder="john@example.com"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                  />
                </div>

                {registrationError && (
                  <div
                    role="alert"
                    className="rounded-lg border border-red-700 bg-red-950 p-4 text-sm text-red-300"
                  >
                    {registrationError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || registered}
                  className="w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "Registering..." : "Complete Registration"}
                </button>

                <p className="text-center text-xs text-slate-500">
                  Your QR ticket will be generated after registration.
                </p>
              </form>
            )}
          </>
        ) : null}
      </div>
    </main>
  );
}
