import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { supabaseServer } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "관리자 인증이 필요합니다." }, { status: 401 });
  }

  const { id: venueId } = await params;
  const body = await req.json();
  const supabase = supabaseServer();

  const clean = (v: any) => (v === "" || v === undefined ? null : v);

  if (!body.eventName || !body.confidence) {
    return NextResponse.json({ error: "행사명과 신뢰도는 필수입니다." }, { status: 400 });
  }

  const { data: event, error: eventError } = await supabase
    .from("events")
    .insert({
      venue_id: venueId,
      event_name: body.eventName,
      event_date: clean(body.eventDate),
      event_year: clean(body.eventYear),
      event_type: clean(body.eventType),
      organizer: clean(body.organizer),
      brand: clean(body.brand),
      description: clean(body.description),
      estimated_attendance: clean(body.estimatedAttendance),
      confidence: body.confidence
    })
    .select()
    .single();

  if (eventError) {
    return NextResponse.json({ error: eventError.message }, { status: 500 });
  }

  // 근거자료(sources) 여러 개를 함께 저장
  const sources = (body.sources ?? []).filter((s: any) => s.url && s.title);
  if (sources.length > 0) {
    const { error: sourceError } = await supabase.from("event_sources").insert(
      sources.map((s: any) => ({
        event_id: event.id,
        source_type: s.sourceType || "other",
        title: s.title,
        url: s.url,
        evidence_text: clean(s.evidenceText),
        confidence: s.confidence || body.confidence
      }))
    );
    if (sourceError) {
      return NextResponse.json({ error: sourceError.message }, { status: 500 });
    }
  }

  // Venue의 마지막 업데이트 시간 갱신
  await supabase
    .from("venues")
    .update({ last_researched_at: new Date().toISOString() })
    .eq("id", venueId);

  return NextResponse.json({ ok: true, event });
}
