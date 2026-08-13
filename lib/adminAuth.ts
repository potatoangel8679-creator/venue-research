import { cookies } from "next/headers";
import crypto from "crypto";

export function isAdminAuthenticated(): boolean {
  const correct = process.env.ADMIN_PASSWORD;
  if (!correct) return false;

  const expected = crypto.createHash("sha256").update(correct).digest("hex");
  const token = cookies().get("admin_session")?.value;
  return token === expected;
}
