import { notFound } from "next/navigation";
import EventDetails from "@/components/EventDetails";

type PageProps = {
  params: Promise<{ eventId: string }>;
};

export default async function EventDetailsPage({ params }: PageProps) {
  const { eventId } = await params;

  const parsedEventId = Number(eventId);

  if (!Number.isSafeInteger(parsedEventId) || parsedEventId <= 0) {
    notFound();
  }

  return <EventDetails eventId={parsedEventId} />;
}
