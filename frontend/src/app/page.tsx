"use client";

import { useState } from "react";
import QRScanner from "@/components/QRScanner";

type CheckInResult = {
  status: "ACCESS_GRANTED" | "ALREADY_CHECKED_IN" | "INVALID_TICKET";
  message: string;
  attendeeName?: string;
  checkedInAt?: string;
};

export default function Home() {
  const [token, setToken] = useState("");
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);

  async function handleCheckIn(scannedToken?: string) {
    const ticketToken = scannedToken ?? token;

    if (!ticketToken.trim()) return;

    setLoading(true);
    setResult(null);
    setError("");

    try {
      const response = await fetch(
        "http://localhost:4000/api/events/1/check-in",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            registrationToken: ticketToken.trim(),
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Server returned an error");
      }

      const data: CheckInResult = await response.json();
      setResult(data);
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold tracking-widest text-blue-400">
            EVENTFLOW
          </p>

          <h1 className="text-3xl font-bold">Reception Dashboard</h1>

          <p className="mt-2 text-slate-400">Calgary Tech Meetup</p>
        </div>

        <label
          htmlFor="ticket-token"
          className="mb-2 block text-sm font-medium"
        >
          Ticket Token
        </label>

        <input
          id="ticket-token"
          type="text"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          placeholder="Enter registration token"
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
        />

        <button
          onClick={() => void handleCheckIn()}
          disabled={loading || !token.trim()}
          className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Checking..." : "Check In"}
        </button>
        <button
          type="button"
          onClick={() => setScannerOpen(!scannerOpen)}
          className="mt-3 w-full rounded-lg border border-slate-600 px-4 py-3 font-semibold transition hover:bg-slate-800"
        >
          {scannerOpen ? "Close Scanner" : "Scan QR Code"}
        </button>

        {scannerOpen && (
          <QRScanner
            onScan={(scannedToken) => {
              setScannerOpen(false);
              setToken(scannedToken);
              void handleCheckIn(scannedToken);
            }}
          />
        )}
        {result && (
          <div
            className={`mt-6 rounded-xl border p-5 ${
              result.status === "ACCESS_GRANTED"
                ? "border-green-700 bg-green-950 text-green-300"
                : result.status === "ALREADY_CHECKED_IN"
                  ? "border-yellow-700 bg-yellow-950 text-yellow-300"
                  : "border-red-700 bg-red-950 text-red-300"
            }`}
          >
            <h2 className="text-xl font-bold">
              {result.status.replaceAll("_", " ")}
            </h2>

            <p className="mt-2">{result.message}</p>

            {result.attendeeName && (
              <p className="mt-2 font-medium">
                Attendee: {result.attendeeName}
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-xl border border-red-700 bg-red-950 p-5 text-red-300">
            {error}
          </div>
        )}
      </div>
    </main>
  );
}
