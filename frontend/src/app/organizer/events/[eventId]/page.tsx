import { notFound } from "next/navigation";
import EventDetails from "@/components/EventDetails";

type Props = {
  params: Promise<{ eventId: string }>;
};

export default async function OrganizerEventPage({ params }: Props) {
  const { eventId } = await params;
  const parsedEventId = Number(eventId);

  if (!Number.isSafeInteger(parsedEventId) || parsedEventId <= 0) {
    notFound();
  }

  return <EventDetails eventId={parsedEventId} role="ORGANIZER" />;
}
