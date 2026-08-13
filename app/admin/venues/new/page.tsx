import { isAdminAuthenticated } from "@/lib/adminAuth";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { AdminVenueForm } from "@/components/AdminVenueForm";
import { supabaseServer } from "@/lib/supabase";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function NewVenuePage() {
  if (!(await isAdminAuthenticated())) {
    return <AdminLoginForm />;
  }

  const supabase = supabaseServer();
  const { data: venueTypes } = await supabase.from("venue_types").select("*").order("name_ko");

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <Link href="/admin" className="text-sm text-subtle hover:text-ink">
        ← 관리자 목록으로
      </Link>
      <h1 className="font-display text-2xl text-ink mt-2 mb-1">새 Venue 추가</h1>
      <p className="text-sm text-subtle mb-6">
        확인된 정보만 입력해주세요. 모르는 항목은 비워두면 "정보 확인 필요"로 표시됩니다.
      </p>

      <AdminVenueForm venueTypes={venueTypes ?? []} />
    </div>
  );
}
