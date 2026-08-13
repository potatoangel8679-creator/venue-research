import { createClient } from "@supabase/supabase-js";

// 브라우저에서 사용하는 클라이언트 — 읽기 전용 권한(RLS)만 가짐.
// NEXT_PUBLIC_ 접두사가 붙은 값은 브라우저에 노출되지만, anon key는 원래 공개용으로 설계된 키이며
// 실제 데이터 보호는 Supabase의 Row Level Security(RLS)가 담당합니다.
export const supabaseBrowser = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 서버(API Route)에서만 사용하는 클라이언트 — 쓰기 권한 포함.
// SUPABASE_SERVICE_ROLE_KEY는 절대 NEXT_PUBLIC_ 접두사를 붙이지 않습니다 (브라우저 노출 금지).
export function supabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Supabase 서버 환경변수가 설정되지 않았습니다 (.env.local의 SUPABASE_SERVICE_ROLE_KEY 확인)"
    );
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false }
  });
}
