"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const EVENT_TYPES = [
  "컨퍼런스", "기업행사", "브랜드 이벤트", "팝업스토어", "전시", "콘서트",
  "공연", "패션쇼", "세미나", "네트워킹", "시상식", "제품 론칭"
];

export function SearchBar() {
  const router = useRouter();
  const params = useSearchParams();

  const [region, setRegion] = useState(params.get("region") ?? "");
  const [attendance, setAttendance] = useState(params.get("attendance") ?? "");
  const [eventType, setEventType] = useState(params.get("eventType") ?? "");
  const [showMore, setShowMore] = useState(false);
  const [indoorOutdoor, setIndoorOutdoor] = useState(params.get("indoorOutdoor") ?? "");
  const [minArea, setMinArea] = useState(params.get("minArea") ?? "");
  const [maxArea, setMaxArea] = useState(params.get("maxArea") ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const qs = new URLSearchParams();
    if (region) qs.set("region", region);
    if (attendance) qs.set("attendance", attendance);
    if (eventType) qs.set("eventType", eventType);
    if (indoorOutdoor) qs.set("indoorOutdoor", indoorOutdoor);
    if (minArea) qs.set("minArea", minArea);
    if (maxArea) qs.set("maxArea", maxArea);
    router.push(`/?${qs.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-card border border-line shadow-card p-6">
      <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-3">
        <input
          required
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          placeholder="지역 (예: 서울 성동구)"
          className="border border-line rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
        />
        <input
          required
          type="number"
          min={1}
          value={attendance}
          onChange={(e) => setAttendance(e.target.value)}
          placeholder="예상 인원 (예: 500)"
          className="border border-line rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
        />
        <button
          type="submit"
          className="bg-teal-600 text-white rounded-lg px-6 py-3 text-sm font-medium hover:bg-teal-700 transition-colors"
        >
          Venue 검색
        </button>
      </div>

      <button
        type="button"
        onClick={() => setShowMore((v) => !v)}
        className="mt-3 text-xs text-subtle hover:text-ink transition-colors"
      >
        {showMore ? "상세 필터 닫기" : "상세 필터 열기"}
      </button>

      {showMore && (
        <div className="mt-4 grid sm:grid-cols-4 gap-3 pt-4 border-t border-line">
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="border border-line rounded-lg px-3 py-2 text-sm"
          >
            <option value="">행사 유형 전체</option>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <select
            value={indoorOutdoor}
            onChange={(e) => setIndoorOutdoor(e.target.value)}
            className="border border-line rounded-lg px-3 py-2 text-sm"
          >
            <option value="">실내/야외 전체</option>
            <option value="indoor">실내</option>
            <option value="outdoor">야외</option>
            <option value="both">실내+야외</option>
          </select>

          <input
            type="number"
            value={minArea}
            onChange={(e) => setMinArea(e.target.value)}
            placeholder="최소 면적(㎡)"
            className="border border-line rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="number"
            value={maxArea}
            onChange={(e) => setMaxArea(e.target.value)}
            placeholder="최대 면적(㎡)"
            className="border border-line rounded-lg px-3 py-2 text-sm"
          />
        </div>
      )}
    </form>
  );
}
