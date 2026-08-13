import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// 아주 단순한 형태의 관리자 인증입니다.
// ADMIN_PASSWORD는 .env.local과 Vercel 환경변수에만 저장하고, 절대 코드에 직접 적지 않습니다.
export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const correct = process.env.ADMIN_PASSWORD;

  if (!correct) {
    return NextResponse.json(
      { error: "서버에 ADMIN_PASSWORD가 설정되어 있지 않습니다." },
      { status: 500 }
    );
  }

  if (password !== correct) {
    return NextResponse.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  const token = crypto.createHash("sha256").update(correct).digest("hex");

  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin_session", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 8 // 8시간
  });
  return res;
}
