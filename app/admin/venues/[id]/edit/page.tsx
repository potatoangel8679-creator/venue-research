import { isAdminAuthenticated } from "@/lib/adminAuth";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { AdminVenueForm } from "@/components/AdminVenueForm";
import { AdminEventManager } from "@/components/AdminEventManager";
import { supabaseServer } from "@/lib/supabase";
import { EventRecord, EventSource, Venue } from "@/types";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function EditVenuePage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return <AdminLoginForm />;
  }

  const { id } = await params;
  const supabase = supabaseServer();

  const [{ data: venue }, { data: venueTypes }, { data: events }] = await Promise.all([
    supabase.from("venues").select("*").eq("id", id).single<Venue>(),
    supabase.from("venue_types").select("*").order("name_ko"),
    supabase.from("events").select("*").eq("venue_id", id).order("event_year", { ascending: false })
  ]);

  if (!venue) notFound();

  const eventIds = (events ?? []).map((e: EventRecord) => e.id);
  const { data: sources } = eventIds.length
    ? await supabase.from("event_sources").select("*").in("event_id", eventIds)
    : { data: [] as EventSource[] };

  const sourcesByEvent: Record<string, EventSource[]> = {};
  (sources ?? []).forEach((s: EventSource) => {
    sourcesByEvent[s.event_id] = [...(sourcesByEvent[s.event_id] ?? []), s];
  });

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <Link href="/admin" className="text-sm text-subtle hover:text-ink">
        ← 관리자 목록으로
      </Link>
      <h1 className="font-display text-2xl text-ink mt-2 mb-1">{venue.name} 수정</h1>
      <p className="text-sm text-subtle mb-6">기본정보를 수정하거나 과거 행사를 추가할 수 있습니다.</p>

      <div className="space-y-8">
        <AdminVenueForm venueTypes={venueTypes ?? []} initialVenue={venue} />
        <AdminEventManager venueId={venue.id} events={events ?? []} sourcesByEvent={sourcesByEvent} />
      </div>
    </div>
  );
}
