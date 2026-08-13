// Google Places API 연동 — 반드시 서버(API Route)에서만 호출합니다.
// API Key는 절대 브라우저로 전달하지 않습니다 (NEXT_PUBLIC_ 접두사를 붙이지 않음).
//
// 여기서는 Google이 현재 권장하는 "Places API (New)"를 사용합니다.
// 참고: 기존 legacy Places API(Text Search / Place Details / Place Photo)는
// Google이 신규 프로젝트에 New API 사용을 권장하고 있어 그에 맞춰 구현했습니다.
// 실제 배포 전 Google Cloud Console에서 "Places API (New)"가 활성화되어 있는지,
// 그리고 공식 문서(https://developers.google.com/maps/documentation/places/web-service/op-overview)
// 기준으로 요청 필드/가격 정책이 바뀌지 않았는지 다시 한번 확인해주세요.

const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

function assertKey() {
  if (!PLACES_API_KEY) {
    throw new Error("GOOGLE_PLACES_API_KEY가 설정되지 않았습니다 (.env.local 확인)");
  }
}

export interface GooglePlaceSummary {
  placeId: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  websiteUri: string | null;
  googleMapsUri: string | null;
  photoNames: string[]; // Place Photos API용 리소스 이름
}

// Text Search (New): 자연어 쿼리로 장소 검색
export async function searchPlacesByText(query: string): Promise<GooglePlaceSummary[]> {
  assertKey();

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": PLACES_API_KEY!,
      // FieldMask: 필요한 필드만 요청해서 비용을 절약합니다.
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.location,places.websiteUri,places.googleMapsUri,places.photos"
    },
    body: JSON.stringify({
      textQuery: query,
      languageCode: "ko"
    })
  });

  if (!res.ok) {
    throw new Error(`Google Places 검색 실패: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const places = data.places ?? [];

  return places.map((p: any) => ({
    placeId: p.id,
    name: p.displayName?.text ?? "",
    address: p.formattedAddress ?? null,
    latitude: p.location?.latitude ?? null,
    longitude: p.location?.longitude ?? null,
    websiteUri: p.websiteUri ?? null,
    googleMapsUri: p.googleMapsUri ?? null,
    photoNames: (p.photos ?? []).map((photo: any) => photo.name)
  }));
}

// Place Details (New): Place ID로 상세정보 조회
export async function getPlaceDetails(placeId: string): Promise<GooglePlaceSummary> {
  assertKey();

  const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    headers: {
      "X-Goog-Api-Key": PLACES_API_KEY!,
      "X-Goog-FieldMask":
        "id,displayName,formattedAddress,location,websiteUri,googleMapsUri,photos"
    }
  });

  if (!res.ok) {
    throw new Error(`Google Place Details 실패: ${res.status} ${await res.text()}`);
  }

  const p = await res.json();

  return {
    placeId: p.id,
    name: p.displayName?.text ?? "",
    address: p.formattedAddress ?? null,
    latitude: p.location?.latitude ?? null,
    longitude: p.location?.longitude ?? null,
    websiteUri: p.websiteUri ?? null,
    googleMapsUri: p.googleMapsUri ?? null,
    photoNames: (p.photos ?? []).map((photo: any) => photo.name)
  };
}

// Place Photos (New): photo resource name으로 실제 이미지 URL 생성
// 이 URL 자체에 API Key가 필요하므로, 브라우저에는 이 함수가 만든 "서버를 거치는" 형태로 제공하거나
// 짧은 만료시간의 서명 URL로 감싸는 것을 권장합니다 (app/api/places/photo 참고).
export function buildPhotoFetchUrl(photoName: string, maxWidthPx = 1200): string {
  assertKey();
  return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${maxWidthPx}&key=${PLACES_API_KEY}`;
}
