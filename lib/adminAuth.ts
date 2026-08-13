import { cookies } from "next/headers";
import crypto from "crypto";

export async function isAdminAuthenticated(): Promise<boolean> {
  const correct = process.env.ADMIN_PASSWORD;
  if (!correct) return false;

  const expected = crypto.createHash("sha256").update(correct).digest("hex");
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;
  return token === expected;
}
