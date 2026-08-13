import { isAdminAuthenticated } from "@/lib/adminAuth";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { supabaseServer } from "@/lib/supabase";
import { AdminVenueRow } from "@/components/AdminVenueRow";
import { Venue } from "@/types";

export default async function AdminPage() {
  if (!(await isAdminAuthenticated())) {
    return <AdminLoginForm />;
  }

  const supabase = supabaseServer();
  const { data: venues } = await supabase
    .from("venues")
    .select("*")
    .order("updated_at", { ascending: false });

  const { data: events } = await supabase.from("events").select("id, venue_id, confidence");

  const eventCountByVenue = new Map<string, number>();
  (events ?? []).forEach((e: { id: string; venue_id: string; confidence: string }) => {
    eventCountByVenue.set(e.venue_id, (eventCountByVenue.get(e.venue_id) ?? 0) + 1);
  });

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="font-display text-2xl text-ink mb-1">관리자 페이지</h1>
      <p className="text-sm text-subtle mb-8">
        등록된 Venue와 과거 행사 데이터를 확인하고 관리합니다.
      </p>

      <div className="bg-white border border-line rounded-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-paper text-subtle text-left">
            <tr>
              <th className="px-4 py-3 font-medium">이름</th>
              <th className="px-4 py-3 font-medium">지역</th>
              <th className="px-4 py-3 font-medium">확인된 행사 수</th>
              <th className="px-4 py-3 font-medium">마지막 조사일</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {(venues ?? []).map((venue: Venue) => (
              <AdminVenueRow
                key={venue.id}
                venue={venue}
                eventCount={eventCountByVenue.get(venue.id) ?? 0}
              />
            ))}
            {(!venues || venues.length === 0) && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-subtle">
                  아직 등록된 Venue가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
