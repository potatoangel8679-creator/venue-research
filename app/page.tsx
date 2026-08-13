import { SearchBar } from "@/components/SearchBar";
import { VenueCard } from "@/components/VenueCard";
import { supabaseServer } from "@/lib/supabase";
import { calculateVenueScore, buildReasonText } from "@/lib/scoring";
import { EventRecord, Venue, VenueSearchParams, VenueSearchResult } from "@/types";

async function fetchResults(params: VenueSearchParams): Promise<VenueSearchResult[]> {
  const supabase = supabaseServer();

  // 1) 후보 Venue 조회 (지역/면적 등 1차 필터만 DB에서, 정교한 점수는 애플리케이션에서 계산)
  let query = supabase.from("venues").select("*").ilike("region", `%${params.region}%`);

  if (params.indoorOutdoor) query = query.eq("indoor_outdoor", params.indoorOutdoor);
  if (params.minAreaSqm) query = query.gte("total_area_sqm", params.minAreaSqm);
  if (params.maxAreaSqm) query = query.lte("total_area_sqm", params.maxAreaSqm);

  const { data: venues, error } = await query;
  if (error) throw error;
  if (!venues || venues.length === 0) return [];

  // 2) 각 Venue의 과거 행사 조회
  const venueIds = venues.map((v: Venue) => v.id);
  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("*")
    .in("venue_id", venueIds);
  if (eventsError) throw eventsError;

  const eventsByVenue = new Map<string, EventRecord[]>();
  (events ?? []).forEach((e: EventRecord & { venue_id: string }) => {
    const list = eventsByVenue.get(e.venue_id) ?? [];
    list.push(e);
    eventsByVenue.set(e.venue_id, list);
  });

  // 3) 점수 계산 및 정렬
  const results: VenueSearchResult[] = venues.map((venue: Venue) => {
    const venueEvents = eventsByVenue.get(venue.id) ?? [];
    const { score, breakdown } = calculateVenueScore(venue, venueEvents, params);
    return {
      venue,
      score,
      scoreBreakdown: breakdown,
      matchedEventCount: venueEvents.length,
      reason: buildReasonText(venue, venueEvents, params)
    };
  });

  return results.sort((a, b) => b.score - a.score);
}

export default async function HomePage({
  searchParams
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const region = searchParams.region;
  const attendance = searchParams.attendance ? Number(searchParams.attendance) : undefined;

  const hasSearch = !!region && !!attendance;

  let results: VenueSearchResult[] = [];
  let searchError: string | null = null;

  if (hasSearch) {
    try {
      results = await fetchResults({
        region: region!,
        expectedAttendance: attendance!,
        eventType: searchParams.eventType || undefined,
        indoorOutdoor: (searchParams.indoorOutdoor as any) || undefined,
        minAreaSqm: searchParams.minArea ? Number(searchParams.minArea) : undefined,
        maxAreaSqm: searchParams.maxArea ? Number(searchParams.maxArea) : undefined
      });
    } catch (e: any) {
      searchError = e.message ?? "검색 중 오류가 발생했습니다.";
    }
  }

  return (
    <div>
      <section className="max-w-6xl mx-auto px-6 pt-14 pb-10">
        <h1 className="font-display text-3xl sm:text-4xl text-ink leading-tight max-w-xl">
          근거 있는 행사장 추천, <br /> Venue Research
        </h1>
        <p className="text-subtle mt-3 max-w-lg text-sm leading-relaxed">
          조건을 입력하면 실제 과거 행사 기록을 근거로 적합한 행사장을 추천합니다.
          추정하지 않고, 확인된 정보만 보여드립니다.
        </p>

        <div className="mt-8 max-w-3xl">
          <SearchBar />
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-20">
        {!hasSearch && (
          <p className="text-sm text-subtle">지역과 예상 인원을 입력하고 검색해보세요.</p>
        )}

        {hasSearch && searchError && (
          <p className="text-sm text-red-600">검색 중 문제가 발생했습니다: {searchError}</p>
        )}

        {hasSearch && !searchError && (
          <>
            <p className="text-sm text-ink/70 mb-6">
              <strong className="text-ink">
                {attendance?.toLocaleString()}명 규모
                {searchParams.eventType ? ` ${searchParams.eventType}` : ""}에 적합한 {region} Venue
              </strong>{" "}
              {results.length}곳을 찾았습니다.
            </p>

            {results.length === 0 ? (
              <p className="text-sm text-subtle">
                조건에 맞는 Venue를 아직 찾지 못했습니다. 필터를 조정해보시거나,
                관리자 페이지에서 신규 장소 리서치를 요청해보세요.
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {results.map((r) => (
                  <VenueCard key={r.venue.id} result={r} />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
