import { WebSearchResultItem } from "./searchProvider";

export interface ExtractedEvent {
  eventName: string;
  eventDate: string | null;
  eventYear: number | null;
  organizer: string | null;
  brand: string | null;
  eventType: string | null;
  estimatedAttendance: number | null;
  confidenceScore: "high" | "medium" | "low";
  sources: {
    title: string;
    url: string;
    sourceType: "news" | "press_release" | "brand_official" | "venue_official" | "blog_review" | "other";
    evidenceText: string;
  }[];
}

const SYSTEM_PROMPT = `당신은 행사장(Venue) 리서치 보조원입니다.
아래에 주어진 웹 검색 결과(제목, URL, 스니펫)만 근거로, 이 장소에서 실제로 열렸던 "행사"를 정리하세요.

절대 규칙:
1. 검색 결과에 명시적으로 나오지 않은 정보는 만들어내지 마세요. 모르면 null로 두세요.
2. 참석자 수, 면적 등 숫자는 검색 결과 스니펫에 실제로 숫자가 언급된 경우에만 채우세요.
3. 같은 행사가 여러 검색 결과에서 발견되면 하나의 이벤트로 묶고, sources 배열에 여러 출처를 모두 넣으세요.
4. 이 장소가 검색 결과에 언급되긴 했지만, 실제로 "이 장소에서 행사가 열렸다"는 내용이 아니라면 (예: 단순히 근처 언급, 무관한 동명이인 장소) 이벤트로 만들지 마세요.
5. 반드시 순수 JSON 배열만 출력하세요. 다른 설명 문장을 절대 추가하지 마세요.

출력 형식 (JSON 배열):
[{
  "eventName": string,
  "eventDate": string | null,
  "eventYear": number | null,
  "organizer": string | null,
  "brand": string | null,
  "eventType": string | null,
  "estimatedAttendance": number | null,
  "confidenceScore": "high" | "medium" | "low",
  "sources": [{ "title": string, "url": string, "sourceType": "news"|"press_release"|"brand_official"|"venue_official"|"blog_review"|"other", "evidenceText": string }]
}]`;

export async function extractEventsFromSearchResults(
  venueName: string,
  results: WebSearchResultItem[]
): Promise<ExtractedEvent[]> {
  if (results.length === 0) return [];

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("[aiExtract] ANTHROPIC_API_KEY가 없어 AI 구조화를 건너뜁니다.");
    return [];
  }

  const userContent = `장소명: ${venueName}\n\n검색 결과:\n${results
    .map((r, i) => `[${i + 1}] 제목: ${r.title}\nURL: ${r.url}\n출처: ${r.source}\n내용: ${r.snippet}`)
    .join("\n\n")}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userContent }]
    })
  });

  if (!res.ok) {
    throw new Error(`AI 구조화 요청 실패: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const text = data.content?.find((c: any) => c.type === "text")?.text ?? "[]";

  try {
    const cleaned = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned) as ExtractedEvent[];
  } catch (e) {
    console.error("[aiExtract] JSON 파싱 실패:", text);
    return [];
  }
}
