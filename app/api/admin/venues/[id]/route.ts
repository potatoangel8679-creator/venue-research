import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { supabaseServer } from "@/lib/supabase";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "관리자 인증이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;
  const supabase = supabaseServer();
  // venue를 삭제하면 관련된 photos/sources/events/event_sources도 함께 삭제됩니다.
  // (schema.sql에서 on delete cascade로 설정되어 있습니다.)
  const { error } = await supabase.from("venues").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
