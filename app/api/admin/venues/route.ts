import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { supabaseServer } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "관리자 인증이 필요합니다." }, { status: 401 });
  }

  const body = await req.json();
  const supabase = supabaseServer();

  // 빈 문자열은 null로, 숫자 필드는 확실히 숫자로 변환
  const clean = (v: any) => (v === "" || v === undefined ? null : v);
  const cleanNum = (v: any) => {
    if (v === "" || v === undefined || v === null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const { data, error } = await supabase
    .from("venues")
    .insert({
      name: body.name,
      address: clean(body.address),
      region: clean(body.region),
      venue_type_id: clean(body.venue_type_id),
      total_area_sqm: cleanNum(body.total_area_sqm),
      rentable_area_sqm: cleanNum(body.rentable_area_sqm),
      max_capacity: cleanNum(body.max_capacity),
      seated_capacity: cleanNum(body.seated_capacity),
      standing_capacity: cleanNum(body.standing_capacity),
      indoor_outdoor: clean(body.indoor_outdoor),
      primary_use: body.primary_use?.length ? body.primary_use : null,
      official_website: clean(body.official_website),
      google_maps_url: clean(body.google_maps_url)
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, venue: data });
}
