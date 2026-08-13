// 웹 검색 공급자 추상화 레이어
//
// 목적: 과거 행사 조사를 위한 웹 검색 API를 특정 업체에 고정하지 않기 위함입니다.
// 지금 어떤 API를 연결하든, 나중에 다른 검색 공급자로 교체할 때
// 이 인터페이스(SearchProvider)만 구현하는 새 파일을 추가하고
// getSearchProvider()의 반환값만 바꾸면 됩니다. 핵심 리서치 로직은 전혀 손댈 필요가 없습니다.
//
// ⚠️ 주의: 웹사이트를 무단으로 대량 크롤링하는 방식은 사용하지 않습니다.
// 반드시 각 검색 API/서비스의 이용약관을 준수하는 공식 API를 사용해야 합니다.
// (예: Google Programmable Search Engine, Bing Web Search API, 기타 뉴스/검색 API 등
//  — 실제 계약 전 각 서비스의 최신 이용약관과 요금 정책을 확인해주세요.)

export interface WebSearchResultItem {
  title: string;
  url: string;
  snippet: string;
  source: string; // 도메인 또는 매체명
  publishedDate?: string | null;
}

export interface SearchProvider {
  name: string;
  search(query: string, options?: { language?: "ko" | "en"; limit?: number }): Promise<WebSearchResultItem[]>;
}

// ---- 예시 구현체 (실제 연결 전까지는 빈 배열 반환) ----
// 실제 서비스에서는 이 클래스를 실제 검색 API 호출 코드로 교체합니다.
class NotConfiguredSearchProvider implements SearchProvider {
  name = "not-configured";
  async search(): Promise<WebSearchResultItem[]> {
    console.warn(
      "[searchProvider] 검색 공급자가 아직 연결되지 않았습니다. lib/searchProvider.ts를 확인해주세요."
    );
    return [];
  }
}

// 현재 활성화된 공급자를 반환합니다. (환경변수로 스위칭)
export function getSearchProvider(): SearchProvider {
  const provider = process.env.SEARCH_PROVIDER ?? "none";

  switch (provider) {
    // case "bing": return new BingSearchProvider();
    // case "google_cse": return new GoogleCseSearchProvider();
    default:
      return new NotConfiguredSearchProvider();
  }
}

// 특정 장소에 대한 과거 행사를 찾기 위한 검색어 자동 생성
// 한국어/영어 검색어를 모두 만들어서 두 언어권 자료를 모두 확인합니다.
export function buildResearchQueries(venueName: string, region?: string | null): string[] {
  const queries = [
    `${venueName} 행사`,
    `${venueName} 컨퍼런스`,
    `${venueName} 브랜드 행사`,
    `${venueName} 전시`,
    `${venueName} event`,
    `${venueName} conference`,
    `${venueName} brand event`,
    `${venueName} launch event`
  ];
  if (region) {
    queries.push(`${venueName} ${region} 행사`);
  }
  return queries;
}
