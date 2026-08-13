"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Venue, VenueType } from "@/types";

const EVENT_USE_OPTIONS = [
  "컨퍼런스", "기업행사", "브랜드 이벤트", "팝업스토어", "전시", "콘서트",
  "공연", "패션쇼", "세미나", "네트워킹", "시상식", "제품 론칭"
];

interface Props {
  venueTypes: VenueType[];
  initialVenue?: Venue; // 있으면 "수정 모드", 없으면 "추가 모드"
}

export function AdminVenueForm({ venueTypes, initialVenue }: Props) {
  const router = useRouter();
  const isEdit = !!initialVenue;

  const [form, setForm] = useState({
    name: initialVenue?.name ?? "",
    address: initialVenue?.address ?? "",
    region: initialVenue?.region ?? "",
    venue_type_id: initialVenue?.venue_type_id ?? "",
    total_area_sqm: initialVenue?.total_area_sqm?.toString() ?? "",
    rentable_area_sqm: initialVenue?.rentable_area_sqm?.toString() ?? "",
    max_capacity: initialVenue?.max_capacity?.toString() ?? "",
    seated_capacity: initialVenue?.seated_capacity?.toString() ?? "",
    standing_capacity: initialVenue?.standing_capacity?.toString() ?? "",
    indoor_outdoor: initialVenue?.indoor_outdoor ?? "",
    primary_use: initialVenue?.primary_use ?? ([] as string[]),
    official_website: initialVenue?.official_website ?? "",
    google_maps_url: initialVenue?.google_maps_url ?? ""
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleUse(use: string) {
    setForm((f) => ({
      ...f,
      primary_use: f.primary_use.includes(use)
        ? f.primary_use.filter((u) => u !== use)
        : [...f.primary_use, use]
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("장소명은 필수입니다.");
      return;
    }
    setSaving(true);
    setError(null);

    const url = isEdit ? `/api/admin/venues/${initialVenue!.id}` : "/api/admin/venues";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "저장 중 오류가 발생했습니다.");
      return;
    }

    const data = await res.json();
    const venueId = isEdit ? initialVenue!.id : data.venue.id;
    router.push(`/admin/venues/${venueId}/edit`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-line rounded-card p-6 space-y-5">
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">{error}</p>}

      <div>
        <label className="block text-xs text-subtle mb-1">장소명 *</label>
        <input
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full border border-line rounded-lg px-3 py-2 text-sm"
          placeholder="예: 코엑스 (COEX)"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-subtle mb-1">주소</label>
          <input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full border border-line rounded-lg px-3 py-2 text-sm"
            placeholder="서울특별시 강남구 ..."
          />
        </div>
        <div>
          <label className="block text-xs text-subtle mb-1">지역 (검색 필터용)</label>
          <input
            value={form.region}
            onChange={(e) => setForm({ ...form, region: e.target.value })}
            className="w-full border border-line rounded-lg px-3 py-2 text-sm"
            placeholder="예: 서울 강남구"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-subtle mb-1">장소 유형</label>
          <select
            value={form.venue_type_id ?? ""}
            onChange={(e) => setForm({ ...form, venue_type_id: e.target.value })}
            className="w-full border border-line rounded-lg px-3 py-2 text-sm"
          >
            <option value="">선택 안 함</option>
            {venueTypes.map((t) => (
              <option key={t.id} value={t.id}>{t.name_ko}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-subtle mb-1">실내/야외</label>
          <select
            value={form.indoor_outdoor ?? ""}
            onChange={(e) => setForm({ ...form, indoor_outdoor: e.target.value as any })}
            className="w-full border border-line rounded-lg px-3 py-2 text-sm"
          >
            <option value="">선택 안 함</option>
            <option value="indoor">실내</option>
            <option value="outdoor">야외</option>
            <option value="both">실내+야외</option>
          </select>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-subtle mb-1">전체 면적 (㎡)</label>
          <input
            type="number"
            value={form.total_area_sqm}
            onChange={(e) => setForm({ ...form, total_area_sqm: e.target.value })}
            className="w-full border border-line rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-subtle mb-1">대관 가능 면적 (㎡)</label>
          <input
            type="number"
            value={form.rentable_area_sqm}
            onChange={(e) => setForm({ ...form, rentable_area_sqm: e.target.value })}
            className="w-full border border-line rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs text-subtle mb-1">최대 수용인원</label>
          <input
            type="number"
            value={form.max_capacity}
            onChange={(e) => setForm({ ...form, max_capacity: e.target.value })}
            className="w-full border border-line rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-subtle mb-1">좌석형 수용인원</label>
          <input
            type="number"
            value={form.seated_capacity}
            onChange={(e) => setForm({ ...form, seated_capacity: e.target.value })}
            className="w-full border border-line rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-subtle mb-1">스탠딩 수용인원</label>
          <input
            type="number"
            value={form.standing_capacity}
            onChange={(e) => setForm({ ...form, standing_capacity: e.target.value })}
            className="w-full border border-line rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-subtle mb-2">주요 용도 (해당하는 것 모두 선택)</label>
        <div className="flex flex-wrap gap-2">
          {EVENT_USE_OPTIONS.map((use) => (
            <button
              key={use}
              type="button"
              onClick={() => toggleUse(use)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                form.primary_use.includes(use)
                  ? "bg-teal-600 text-white border-teal-600"
                  : "bg-white text-ink/70 border-line hover:border-teal-400"
              }`}
            >
              {use}
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-subtle mb-1">공식 홈페이지</label>
          <input
            value={form.official_website}
            onChange={(e) => setForm({ ...form, official_website: e.target.value })}
            className="w-full border border-line rounded-lg px-3 py-2 text-sm"
            placeholder="https://..."
          />
        </div>
        <div>
          <label className="block text-xs text-subtle mb-1">Google Maps 링크</label>
          <input
            value={form.google_maps_url}
            onChange={(e) => setForm({ ...form, google_maps_url: e.target.value })}
            className="w-full border border-line rounded-lg px-3 py-2 text-sm"
            placeholder="https://maps.google.com/..."
          />
        </div>
      </div>

      <div className="pt-2 flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="bg-teal-600 text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-60"
        >
          {saving ? "저장 중..." : isEdit ? "수정 저장" : "Venue 추가"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="text-sm text-subtle hover:text-ink px-2"
        >
          취소
        </button>
      </div>
    </form>
  );
}
