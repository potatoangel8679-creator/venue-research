"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { EventRecord, EventSource, ConfidenceLevel, SourceType } from "@/types";

const EVENT_TYPES = [
  "컨퍼런스", "기업행사", "브랜드 이벤트", "팝업스토어", "전시", "콘서트",
  "공연", "패션쇼", "세미나", "네트워킹", "시상식", "제품 론칭"
];

const SOURCE_TYPES: { value: SourceType; label: string }[] = [
  { value: "news", label: "뉴스기사" },
  { value: "press_release", label: "언론 보도자료" },
  { value: "brand_official", label: "브랜드 공식 홈페이지" },
  { value: "venue_official", label: "행사장 공식 홈페이지" },
  { value: "blog_review", label: "블로그 후기" },
  { value: "other", label: "기타" }
];

interface SourceDraft {
  sourceType: SourceType;
  title: string;
  url: string;
  evidenceText: string;
}

const emptySource: SourceDraft = { sourceType: "news", title: "", url: "", evidenceText: "" };

export function AdminEventManager({
  venueId,
  events,
  sourcesByEvent
}: {
  venueId: string;
  events: EventRecord[];
  sourcesByEvent: Record<string, EventSource[]>;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventYear, setEventYear] = useState("");
  const [eventType, setEventType] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [brand, setBrand] = useState("");
  const [description, setDescription] = useState("");
  const [estimatedAttendance, setEstimatedAttendance] = useState("");
  const [confidence, setConfidence] = useState<ConfidenceLevel>("medium");
  const [sources, setSources] = useState<SourceDraft[]>([{ ...emptySource }]);

  function resetForm() {
    setEventName(""); setEventDate(""); setEventYear(""); setEventType("");
    setOrganizer(""); setBrand(""); setDescription(""); setEstimatedAttendance("");
    setConfidence("medium"); setSources([{ ...emptySource }]);
  }

  async function handleAddEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!eventName.trim()) {
      setError("행사명은 필수입니다.");
      return;
    }
    // 근거자료 없이 저장하려는 경우 확인 (원칙상 출처가 있어야 함을 안내)
    const validSources = sources.filter((s) => s.url && s.title);
    if (validSources.length === 0) {
      if (!confirm("근거자료(출처 링크)가 하나도 없습니다. 그래도 저장하시겠습니까?")) return;
    }

    setSaving(true);
    setError(null);

    const res = await fetch(`/api/admin/venues/${venueId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventName,
        eventDate: eventDate || null,
        eventYear: eventYear ? Number(eventYear) : null,
        eventType: eventType || null,
        organizer: organizer || null,
        brand: brand || null,
        description: description || null,
        estimatedAttendance: estimatedAttendance ? Number(estimatedAttendance) : null,
        confidence,
        sources: validSources
      })
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "저장 중 오류가 발생했습니다.");
      return;
    }

    resetForm();
    setShowForm(false);
    router.refresh();
  }

  async function handleDeleteEvent(eventId: string) {
    if (!confirm("이 행사 기록을 삭제하시겠습니까?")) return;
    const res = await fetch(`/api/admin/events/${eventId}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else alert("삭제 중 오류가 발생했습니다.");
  }

  function updateSource(idx: number, patch: Partial<SourceDraft>) {
    setSources((s) => s.map((src, i) => (i === idx ? { ...src, ...patch } : src)));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-lg text-ink">과거 행사 ({events.length}건)</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-sm text-teal-600 font-medium hover:underline"
        >
          {showForm ? "닫기" : "+ 행사 추가"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAddEvent} className="bg-white border border-line rounded-card p-5 mb-5 space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}

          <div>
            <label className="block text-xs text-subtle mb-1">행사명 *</label>
            <input
              required
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="w-full border border-line rounded-lg px-3 py-2 text-sm"
              placeholder="예: Samsung Galaxy Unpacked 2025"
            />
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-subtle mb-1">날짜 (아는 경우)</label>
              <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="w-full border border-line rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-subtle mb-1">연도만 아는 경우</label>
              <input type="number" value={eventYear} onChange={(e) => setEventYear(e.target.value)} placeholder="2025" className="w-full border border-line rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-subtle mb-1">행사 유형</label>
              <select value={eventType} onChange={(e) => setEventType(e.target.value)} className="w-full border border-line rounded-lg px-3 py-2 text-sm">
                <option value="">선택 안 함</option>
                {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-subtle mb-1">주최사</label>
              <input value={organizer} onChange={(e) => setOrganizer(e.target.value)} className="w-full border border-line rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-subtle mb-1">브랜드</label>
              <input value={brand} onChange={(e) => setBrand(e.target.value)} className="w-full border border-line rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-subtle mb-1">참석 인원 (출처에 숫자가 있을 때만)</label>
              <input type="number" value={estimatedAttendance} onChange={(e) => setEstimatedAttendance(e.target.value)} className="w-full border border-line rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-subtle mb-1">간단 설명</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full border border-line rounded-lg px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="block text-xs text-subtle mb-1">정보 신뢰도 *</label>
            <select value={confidence} onChange={(e) => setConfidence(e.target.value as ConfidenceLevel)} className="w-full sm:w-52 border border-line rounded-lg px-3 py-2 text-sm">
              <option value="high">High (공식 홈페이지, 신뢰할 수 있는 언론)</option>
              <option value="medium">Medium (전문 매체, 신뢰할 수 있는 블로그)</option>
              <option value="low">Low (출처 불분명)</option>
            </select>
          </div>

          <div className="pt-3 border-t border-line">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs text-subtle">Evidence (근거자료 — 출처 링크)</label>
              <button
                type="button"
                onClick={() => setSources((s) => [...s, { ...emptySource }])}
                className="text-xs text-teal-600 hover:underline"
              >
                + 출처 추가
              </button>
            </div>

            <div className="space-y-3">
              {sources.map((src, idx) => (
                <div key={idx} className="bg-paper rounded-lg p-3 grid sm:grid-cols-[140px_1fr] gap-2">
                  <select
                    value={src.sourceType}
                    onChange={(e) => updateSource(idx, { sourceType: e.target.value as SourceType })}
                    className="border border-line rounded-lg px-2 py-1.5 text-xs"
                  >
                    {SOURCE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <input
                    value={src.title}
                    onChange={(e) => updateSource(idx, { title: e.target.value })}
                    placeholder="출처 제목 (예: 매일경제 - ○○ 행사 기사)"
                    className="border border-line rounded-lg px-2 py-1.5 text-xs"
                  />
                  <input
                    value={src.url}
                    onChange={(e) => updateSource(idx, { url: e.target.value })}
                    placeholder="https://..."
                    className="sm:col-span-2 border border-line rounded-lg px-2 py-1.5 text-xs"
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-teal-600 text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-60"
          >
            {saving ? "저장 중..." : "행사 저장"}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {events.map((ev) => (
          <div key={ev.id} className="bg-white border border-line rounded-card p-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-ink">{ev.event_name}</p>
              <p className="text-xs text-subtle mt-0.5">
                {ev.event_date ?? (ev.event_year ? `${ev.event_year}년` : "날짜 확인 필요")}
                {ev.event_type ? ` · ${ev.event_type}` : ""} · 근거자료 {sourcesByEvent[ev.id]?.length ?? 0}건
              </p>
            </div>
            <button
              onClick={() => handleDeleteEvent(ev.id)}
              className="text-xs text-red-600 hover:underline shrink-0"
            >
              삭제
            </button>
          </div>
        ))}
        {events.length === 0 && (
          <p className="text-sm text-subtle bg-white border border-line rounded-card p-4">
            아직 등록된 과거 행사가 없습니다.
          </p>
        )}
      </div>
    </div>
  );
}
