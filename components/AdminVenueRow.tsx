"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Venue } from "@/types";
import Link from "next/link";

export function AdminVenueRow({ venue, eventCount }: { venue: Venue; eventCount: number }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`"${venue.name}" 데이터를 정말 삭제하시겠습니까? 되돌릴 수 없습니다.`)) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/venues/${venue.id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) router.refresh();
    else alert("삭제 중 오류가 발생했습니다.");
  }

  return (
    <tr className="border-t border-line">
      <td className="px-4 py-3">
        <Link href={`/venue/${venue.id}`} className="text-ink hover:text-teal-600">
          {venue.name}
        </Link>
      </td>
      <td className="px-4 py-3 text-subtle">{venue.region ?? "확인 필요"}</td>
      <td className="px-4 py-3 text-subtle">{eventCount}건</td>
      <td className="px-4 py-3 text-subtle">
        {venue.last_researched_at ? new Date(venue.last_researched_at).toLocaleDateString("ko-KR") : "미조사"}
      </td>
      <td className="px-4 py-3 text-right">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs text-red-600 hover:underline disabled:opacity-50"
        >
          {deleting ? "삭제 중..." : "삭제"}
        </button>
      </td>
    </tr>
  );
}
