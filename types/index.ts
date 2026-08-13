// 이 파일은 데이터베이스 구조(supabase/schema.sql)와 1:1로 대응합니다.
// 값이 없을 수 있는 필드는 전부 null 허용 — "정보 확인 필요"를 표현하기 위함입니다.
// 절대 여기 있는 필드를 임의의 추정값으로 채우지 않습니다 (원칙 27번).

export type ConfidenceLevel = "high" | "medium" | "low";

export type SourceType =
  | "news"
  | "press_release"
  | "brand_official"
  | "venue_official"
  | "blog_review"
  | "other";

export interface VenueType {
  id: string;
  name_ko: string;
  name_en: string;
}

export interface Venue {
  id: string;
  google_place_id: string | null;
  name: string;
  address: string | null;
  region: string | null; // 예: "서울 성동구"
  latitude: number | null;
  longitude: number | null;
  venue_type_id: string | null;

  total_area_sqm: number | null; // 전체 면적
  rentable_area_sqm: number | null; // 대관 가능 면적
  max_capacity: number | null; // 최대 수용인원
  seated_capacity: number | null; // 좌석형 수용인원
  standing_capacity: number | null; // 스탠딩 수용인원
  indoor_outdoor: "indoor" | "outdoor" | "both" | null;

  primary_use: string[] | null; // 예: ["전시", "컨퍼런스"]
  official_website: string | null;
  google_maps_url: string | null;

  last_researched_at: string | null; // ISO timestamp — 캐시 판단 기준
  created_at: string;
  updated_at: string;
}

export interface VenuePhoto {
  id: string;
  venue_id: string;
  url: string;
  source: "google_places" | "official_site" | "uploaded";
  attribution: string | null;
}

export interface VenueSource {
  id: string;
  venue_id: string;
  source_type: SourceType;
  title: string;
  url: string;
  confidence: ConfidenceLevel;
}

export interface EventRecord {
  id: string;
  venue_id: string;
  event_name: string;
  event_date: string | null; // YYYY-MM-DD, 모르면 null
  event_year: number | null; // 날짜는 모르지만 연도만 아는 경우
  event_type: string | null; // 컨퍼런스 / 브랜드 이벤트 등
  organizer: string | null;
  brand: string | null;
  description: string | null;
  estimated_attendance: number | null; // 출처에 명시된 경우만
  confidence: ConfidenceLevel;
  created_at: string;
}

export interface EventSource {
  id: string;
  event_id: string;
  source_type: SourceType;
  title: string;
  url: string;
  evidence_text: string | null; // 근거가 되는 원문 발췌(짧게, 저작권 고려)
  image_url: string | null;
  confidence: ConfidenceLevel;
}

export interface ResearchJob {
  id: string;
  venue_id: string;
  status: "pending" | "running" | "done" | "failed";
  started_at: string | null;
  finished_at: string | null;
  error_message: string | null;
}

// ---- 검색 요청/결과 ----

export interface VenueSearchParams {
  region: string;
  expectedAttendance: number;
  eventType?: string;
  venueType?: string;
  indoorOutdoor?: "indoor" | "outdoor" | "both";
  minAreaSqm?: number;
  maxAreaSqm?: number;
}

export interface VenueSearchResult {
  venue: Venue;
  score: number; // 0~100 추천 적합도
  scoreBreakdown: ScoreBreakdown;
  matchedEventCount: number; // 조건과 유사한 과거 행사 개수
  reason: string; // 사용자에게 보여줄 추천 이유 한 줄 (실제 숫자 있을 때만 구체적 문구 사용)
}

export interface ScoreBreakdown {
  capacityFit: number | null;
  regionFit: number | null;
  eventTypeFit: number | null;
  pastEventFrequency: number | null;
  dataConfidence: number | null;
  recency: number | null;
  excludedReasons: string[]; // 데이터가 없어 계산에서 제외된 항목 설명
}
