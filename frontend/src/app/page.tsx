import Link from "next/link";

const sections = [
  {
    title: "Admin Dashboard",
    description: "Manage events, attendees, registrations, and invitations.",
    href: "/admin",
    label: "Open Admin",
  },
  {
    title: "Reception Dashboard",
    description: "Scan QR tickets, check in attendees, and monitor attendance.",
    href: "/reception",
    label: "Open Reception",
  },
  {
    title: "Public Registration",
    description: "Browse upcoming events and register for an event.",
    href: "/events",
    label: "Browse Events",
  },
];

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
      <div className="w-full max-w-5xl">
        <header className="mb-12 text-center">
          <p className="mb-3 text-sm font-semibold tracking-widest text-blue-400">
            EVENTFLOW
          </p>

          <h1 className="text-4xl font-bold">Event Management Platform</h1>

          <p className="mt-4 text-slate-400">
            Manage events, registrations, and attendee check-ins in one place.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          {sections.map((section) => (
            <div
              key={section.title}
              className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl"
            >
              <h2 className="text-xl font-semibold">{section.title}</h2>

              <p className="mt-3 flex-1 text-sm leading-6 text-slate-400">
                {section.description}
              </p>

              <Link
                href={section.href}
                className="mt-8 block rounded-lg bg-blue-600 px-4 py-3 text-center font-semibold transition hover:bg-blue-500"
              >
                {section.label}
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-slate-500">
          EventFlow — Event Registration & Check-in System
        </p>
      </div>
    </main>
  );
}
