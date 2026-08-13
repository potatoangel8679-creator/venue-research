import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { supabaseServer } from "@/lib/supabase";
import { searchPlacesByText, buildPhotoFetchUrl } from "@/lib/googlePlaces";
import { getSearchProvider, buildResearchQueries, WebSearchResultItem } from "@/lib/searchProvider";
import { extractEventsFromSearchResults } from "@/lib/aiExtract";

// 캐시 기준: 이 기간(일)보다 오래되었으면 재조사 대상으로 간주
const STALE_DAYS = 30;

export async function POST(req: NextRequest) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "관리자 인증이 필요합니다." }, { status: 401 });
  }

  const { placeName, region } = await req.json();
  if (!placeName) {
    return NextResponse.json({ error: "placeName이 필요합니다." }, { status: 400 });
  }

  const supabase = supabaseServer();

  // 1) 이미 최근에 조사된 Venue인지 확인 (캐시)
  const { data: existing } = await supabase
    .from("venues")
    .select("*")
    .eq("name", placeName)
    .maybeSingle();

  if (existing?.last_researched_at) {
    const daysSince =
      (Date.now() - new Date(existing.last_researched_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < STALE_DAYS) {
      return NextResponse.json({
        message: "최근에 이미 조사된 Venue입니다. 캐시된 데이터를 사용합니다.",
        venueId: existing.id,
        skipped: true
      });
    }
  }

  // research_jobs 기록 시작
  const venueIdForJob = existing?.id;
  let jobId: string | null = null;
  if (venueIdForJob) {
    const { data: job } = await supabase
      .from("research_jobs")
      .insert({ venue_id: venueIdForJob, status: "running", started_at: new Date().toISOString() })
      .select()
      .single();
    jobId = job?.id ?? null;
  }

  try {
    // 2) Google Places에서 기본 정보 조회
    const places = await searchPlacesByText(`${placeName} ${region ?? ""}`.trim());
    const place = places[0];

    if (!place) {
      return NextResponse.json(
        { error: "Google Places에서 해당 장소를 찾지 못했습니다. 이름/지역을 다시 확인해주세요." },
        { status: 404 }
      );
    }

    // 3) Venue upsert — Google API로 확인된 값만 채움. 면적/수용인원 등은 Google이 제공하지 않으므로
    //    여기서는 채우지 않고 관리자가 공식 자료를 확인해 직접 입력하도록 남겨둡니다 (추정 금지 원칙).
    const { data: venue, error: venueError } = await supabase
      .from("venues")
      .upsert(
        {
          google_place_id: place.placeId,
          name: place.name || placeName,
          address: place.address,
          region: region ?? null,
          latitude: place.latitude,
          longitude: place.longitude,
          official_website: place.websiteUri,
          google_maps_url: place.googleMapsUri,
          last_researched_at: new Date().toISOString()
        },
        { onConflict: "google_place_id" }
      )
      .select()
      .single();

    if (venueError) throw venueError;

    // Google Places 사진 저장 (있는 경우)
    if (place.photoNames.length > 0) {
      await supabase.from("venue_photos").delete().eq("venue_id", venue.id).eq("source", "google_places");
      await supabase.from("venue_photos").insert(
        place.photoNames.slice(0, 5).map((name) => ({
          venue_id: venue.id,
          url: buildPhotoFetchUrl(name),
          source: "google_places" as const,
          attribution: "Google Places"
        }))
      );
    }

    // 4) 웹 검색으로 과거 행사 조사 (한국어 + 영어)
    const provider = getSearchProvider();
    const queries = buildResearchQueries(venue.name, venue.region);
    const allResults: WebSearchResultItem[] = [];

    for (const q of queries) {
      const lang = /[a-zA-Z]/.test(q) && !/[가-힣]/.test(q) ? "en" : "ko";
      const r = await provider.search(q, { language: lang, limit: 5 });
      allResults.push(...r);
    }

    // URL 기준 중복 제거
    const uniqueResults = Array.from(new Map(allResults.map((r) => [r.url, r])).values());

    // 5) AI로 구조화 (원문에 없는 정보는 생성 금지 — lib/aiExtract.ts의 SYSTEM_PROMPT 참고)
    const extracted = await extractEventsFromSearchResults(venue.name, uniqueResults);

    // 6) 이벤트 + 근거자료 저장 (같은 이름+연도는 upsert로 중복 방지)
    let savedEventCount = 0;
    for (const ev of extracted) {
      const { data: eventRow, error: eventError } = await supabase
        .from("events")
        .upsert(
          {
            venue_id: venue.id,
            event_name: ev.eventName,
            event_date: ev.eventDate,
            event_year: ev.eventYear,
            event_type: ev.eventType,
            organizer: ev.organizer,
            brand: ev.brand,
            estimated_attendance: ev.estimatedAttendance,
            confidence: ev.confidenceScore
          },
          { onConflict: "venue_id,event_name,event_year" }
        )
        .select()
        .single();

      if (eventError || !eventRow) continue;
      savedEventCount++;

      for (const src of ev.sources) {
        await supabase
          .from("event_sources")
          .upsert(
            {
              event_id: eventRow.id,
              source_type: src.sourceType,
              title: src.title,
              url: src.url,
              evidence_text: src.evidenceText,
              confidence: ev.confidenceScore
            },
            { onConflict: "event_id,url" }
          );
      }
    }

    if (jobId) {
      await supabase
        .from("research_jobs")
        .update({ status: "done", finished_at: new Date().toISOString() })
        .eq("id", jobId);
    }

    return NextResponse.json({
      message: "리서치가 완료되었습니다.",
      venueId: venue.id,
      searchResultsFound: uniqueResults.length,
      eventsSaved: savedEventCount
    });
  } catch (e: any) {
    if (jobId) {
      await supabase
        .from("research_jobs")
        .update({ status: "failed", finished_at: new Date().toISOString(), error_message: e.message })
        .eq("id", jobId);
    }
    return NextResponse.json({ error: e.message ?? "리서치 중 오류가 발생했습니다." }, { status: 500 });
  }
}
