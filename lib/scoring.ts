// Venue Suitability Score 계산 로직
// ⚠️ 나중에 쉽게 조정할 수 있도록 가중치를 이 파일 상단에 모아두었습니다.
// 데이터가 없는 항목은 0점으로 처리하지 않고 "계산에서 제외"하여, 나머지 항목의 가중치로 재분배합니다.
// (데이터 없음 ≠ 나쁜 점수. 원칙 27번 — 모르는 것을 나쁘게 단정하지 않음)

import { EventRecord, ScoreBreakdown, Venue, VenueSearchParams } from "@/types";

export const SCORE_WEIGHTS = {
  capacityFit: 0.25,
  regionFit: 0.15,
  eventTypeFit: 0.2,
  pastEventFrequency: 0.2,
  dataConfidence: 0.1,
  recency: 0.1
};

function scoreCapacityFit(venue: Venue, requested: number): number | null {
  if (!venue.max_capacity) return null;
  // 요청 인원 대비 얼마나 적정한 규모인지: 너무 작아도, 너무 커도 감점
  const ratio = venue.max_capacity / requested;
  if (ratio < 1) return Math.max(0, 100 * ratio - 20); // 수용 못하면 큰 감점
  if (ratio <= 1.6) return 100; // 1~1.6배: 가장 이상적인 여유
  if (ratio <= 3) return 75;
  if (ratio <= 6) return 50;
  return 30; // 지나치게 큰 공간(예: 500명 행사에 7000명 규모)은 낮은 점수
}

function scoreRegionFit(venue: Venue, requestedRegion: string): number | null {
  if (!venue.region) return null;
  const a = venue.region.replace(/\s/g, "");
  const b = requestedRegion.replace(/\s/g, "");
  if (a === b) return 100;
  if (a.includes(b) || b.includes(a)) return 80; // 예: "서울" vs "서울 성동구"
  return 30;
}

function scoreEventTypeFit(venue: Venue, requestedType?: string, events: EventRecord[] = []): number | null {
  if (!requestedType) return null;
  const usesMatch = venue.primary_use?.includes(requestedType);
  const pastMatch = events.some((e) => e.event_type === requestedType);
  if (usesMatch && pastMatch) return 100;
  if (usesMatch || pastMatch) return 70;
  if (!venue.primary_use && events.length === 0) return null; // 판단 근거 자체가 없음
  return 25;
}

function scorePastEventFrequency(
  events: EventRecord[],
  requestedType?: string,
  requestedAttendance?: number
): number | null {
  if (events.length === 0) return null;

  const relevant = events.filter((e) => {
    const typeOk = !requestedType || e.event_type === requestedType;
    const sizeOk =
      !requestedAttendance ||
      !e.estimated_attendance ||
      (e.estimated_attendance >= requestedAttendance * 0.5 &&
        e.estimated_attendance <= requestedAttendance * 2);
    return typeOk && sizeOk;
  });

  const count = relevant.length;
  if (count === 0) return 20;
  if (count >= 10) return 100;
  return 20 + count * 8; // 건수가 많을수록 점진적으로 상승
}

function scoreDataConfidence(events: EventRecord[]): number | null {
  if (events.length === 0) return null;
  const weight = { high: 100, medium: 60, low: 25 };
  const avg =
    events.reduce((sum, e) => sum + weight[e.confidence], 0) / events.length;
  return Math.round(avg);
}

function scoreRecency(events: EventRecord[]): number | null {
  const years = events.map((e) => e.event_year).filter((y): y is number => !!y);
  if (years.length === 0) return null;
  const mostRecent = Math.max(...years);
  const currentYear = new Date().getFullYear();
  const diff = currentYear - mostRecent;
  if (diff <= 1) return 100;
  if (diff <= 3) return 70;
  if (diff <= 5) return 40;
  return 15;
}

export function calculateVenueScore(
  venue: Venue,
  events: EventRecord[],
  params: VenueSearchParams
): { score: number; breakdown: ScoreBreakdown } {
  const raw: Record<keyof typeof SCORE_WEIGHTS, number | null> = {
    capacityFit: scoreCapacityFit(venue, params.expectedAttendance),
    regionFit: scoreRegionFit(venue, params.region),
    eventTypeFit: scoreEventTypeFit(venue, params.eventType, events),
    pastEventFrequency: scorePastEventFrequency(
      events,
      params.eventType,
      params.expectedAttendance
    ),
    dataConfidence: scoreDataConfidence(events),
    recency: scoreRecency(events)
  };

  const excludedReasons: string[] = [];
  let weightedSum = 0;
  let usedWeight = 0;

  (Object.keys(SCORE_WEIGHTS) as (keyof typeof SCORE_WEIGHTS)[]).forEach((key) => {
    const value = raw[key];
    const weight = SCORE_WEIGHTS[key];
    if (value === null) {
      excludedReasons.push(`${key}: 데이터 부족으로 계산 제외`);
      return;
    }
    weightedSum += value * weight;
    usedWeight += weight;
  });

  // 사용 가능한 항목의 가중치 합으로 정규화 (데이터 부족 시에도 공정한 점수 산출)
  const score = usedWeight > 0 ? Math.round(weightedSum / usedWeight) : 0;

  return {
    score,
    breakdown: {
      capacityFit: raw.capacityFit,
      regionFit: raw.regionFit,
      eventTypeFit: raw.eventTypeFit,
      pastEventFrequency: raw.pastEventFrequency,
      dataConfidence: raw.dataConfidence,
      recency: raw.recency,
      excludedReasons
    }
  };
}

// 사용자에게 보여줄 추천 이유 한 줄 생성 — 실제 데이터가 있을 때만 구체적인 숫자를 사용합니다.
export function buildReasonText(
  venue: Venue,
  events: EventRecord[],
  params: VenueSearchParams
): string {
  const parts: string[] = [];

  if (venue.max_capacity && venue.max_capacity >= params.expectedAttendance) {
    parts.push(`${params.expectedAttendance.toLocaleString()}명 규모 행사를 수용할 수 있으며`);
  }

  const relevantCount = events.filter(
    (e) => !params.eventType || e.event_type === params.eventType
  ).length;

  if (relevantCount > 0) {
    const label = params.eventType ?? "행사";
    parts.push(`최근 확인된 ${label} 관련 레퍼런스 ${relevantCount}건이 있습니다`);
  }

  if (parts.length === 0) {
    return "이 조건에 대한 과거 행사 레퍼런스가 아직 충분히 확인되지 않았습니다.";
  }

  return parts.join(", ") + ".";
}
