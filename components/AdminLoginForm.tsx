"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "로그인에 실패했습니다.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="max-w-sm mx-auto mt-24 bg-white border border-line rounded-card p-8">
      <h1 className="font-display text-xl text-ink mb-1">관리자 로그인</h1>
      <p className="text-sm text-subtle mb-6">관리자 비밀번호를 입력해주세요.</p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호"
          className="w-full border border-line rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-teal-600 text-white rounded-lg px-4 py-3 text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-60"
        >
          {loading ? "확인 중..." : "로그인"}
        </button>
      </form>
    </div>
  );
}
