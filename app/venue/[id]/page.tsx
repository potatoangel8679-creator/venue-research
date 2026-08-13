import { supabaseServer } from "@/lib/supabase";
import { ConfidenceBadge } from "@/components/ConfidenceBadge";
import { EventRecord, EventSource, Venue, VenuePhoto } from "@/types";
import { notFound } from "next/navigation";
import Image from "next/image";

const SOURCE_TYPE_LABEL: Record<string, string> = {
  news: "뉴스기사",
  press_release: "언론 보도자료",
  brand_official: "브랜드 공식 홈페이지",
  venue_official: "행사장 공식 홈페이지",
  blog_review: "블로그 후기",
  other: "기타 출처"
};

function InfoRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between py-2.5 border-b border-line last:border-0">
      <span className="text-sm text-subtle">{label}</span>
      <span className={`text-sm ${value ? "text-ink" : "text-subtle italic"}`}>
        {value ?? "정보 확인 필요"}
      </span>
    </div>
  );
}

export default async function VenueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = supabaseServer();

  const { data: venue } = await supabase
    .from("venues")
    .select("*")
    .eq("id", id)
    .single<Venue>();

  if (!venue) notFound();

  const [{ data: photos }, { data: events }] = await Promise.all([
    supabase.from("venue_photos").select("*").eq("venue_id", venue.id),
    supabase.from("events").select("*").eq("venue_id", venue.id).order("event_year", { ascending: false })
  ]);

  const eventIds = (events ?? []).map((e: EventRecord) => e.id);
  const { data: sources } = eventIds.length
    ? await supabase.from("event_sources").select("*").in("event_id", eventIds)
    : { data: [] as EventSource[] };

  const sourcesByEvent = new Map<string, EventSource[]>();
  (sources ?? []).forEach((s: EventSource) => {
    const list = sourcesByEvent.get(s.event_id) ?? [];
    list.push(s);
    sourcesByEvent.set(s.event_id, list);
  });

  const heroPhoto: VenuePhoto | undefined = (photos ?? [])[0];

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="relative h-72 rounded-card overflow-hidden bg-teal-50">
        <Image
          src={heroPhoto?.url ?? "/placeholder-venue.svg"}
          alt={venue.name}
          fill
          className="object-cover"
        />
      </div>

      <div className="mt-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink">{venue.name}</h1>
          <p className="text-subtle mt-1 text-sm">{venue.address ?? "주소 확인 필요"}</p>
        </div>
        {venue.google_maps_url && (
          <a
            href={venue.google_maps_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-teal-600 font-medium border border-teal-100 bg-teal-50 rounded-lg px-4 py-2 hover:bg-teal-100 transition-colors"
          >
            Google Maps에서 보기 →
          </a>
        )}
      </div>

      <div className="mt-10 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <h2 className="font-display text-lg text-ink mb-3">기본 정보</h2>
          <div className="bg-white rounded-card border border-line p-5">
            <InfoRow label="전체 면적" value={venue.total_area_sqm ? `${venue.total_area_sqm.toLocaleString()}㎡` : null} />
            <InfoRow label="대관 가능 면적" value={venue.rentable_area_sqm ? `${venue.rentable_area_sqm.toLocaleString()}㎡` : null} />
            <InfoRow label="최대 수용인원" value={venue.max_capacity ? `${venue.max_capacity.toLocaleString()}명` : null} />
            <InfoRow label="좌석형 수용인원" value={venue.seated_capacity ? `${venue.seated_capacity.toLocaleString()}명` : null} />
            <InfoRow label="스탠딩 수용인원" value={venue.standing_capacity ? `${venue.standing_capacity.toLocaleString()}명` : null} />
            <InfoRow
              label="실내/야외"
              value={
                venue.indoor_outdoor === "indoor" ? "실내" :
                venue.indoor_outdoor === "outdoor" ? "야외" :
                venue.indoor_outdoor === "both" ? "실내+야외" : null
              }
            />
            <InfoRow label="주요 용도" value={venue.primary_use?.length ? venue.primary_use.join(" / ") : null} />
            <InfoRow label="공식 홈페이지" value={venue.official_website} />
          </div>
        </div>

        <div className="lg:col-span-2">
          <h2 className="font-display text-lg text-ink mb-3">
            이 장소에서 진행된 행사 <span className="text-subtle text-sm font-normal">({(events ?? []).length}건 확인됨)</span>
          </h2>

          {(!events || events.length === 0) && (
            <div className="bg-white rounded-card border border-line p-6 text-sm text-subtle">
              아직 확인된 과거 행사 레퍼런스가 없습니다.
            </div>
          )}

          <div className="space-y-4">
            {(events ?? []).map((event: EventRecord) => {
              const evSources = sourcesByEvent.get(event.id) ?? [];
              return (
                <div key={event.id} className="bg-white rounded-card border border-line p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <h3 className="font-medium text-ink">{event.event_name}</h3>
                      <p className="text-xs text-subtle mt-0.5">
                        {event.event_date ?? (event.event_year ? `${event.event_year}년` : "날짜 확인 필요")}
                        {event.event_type ? ` · ${event.event_type}` : ""}
                        {event.organizer ? ` · 주최: ${event.organizer}` : ""}
                      </p>
                    </div>
                    <ConfidenceBadge level={event.confidence} />
                  </div>

                  {event.description && (
                    <p className="text-sm text-ink/80 mt-3 leading-relaxed">{event.description}</p>
                  )}

                  {evSources.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-line">
                      <p className="text-xs text-subtle mb-2">Evidence (근거자료 {evSources.length}건)</p>
                      <div className="flex flex-wrap gap-2">
                        {evSources.map((s) => (
                          <a
                            key={s.id}
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs bg-paper border border-line rounded-full px-3 py-1.5 hover:border-teal-400 hover:text-teal-600 transition-colors"
                          >
                            {SOURCE_TYPE_LABEL[s.source_type] ?? "출처"} · {s.title}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
