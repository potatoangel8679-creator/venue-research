import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "500", "600"]
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter"
});

export const metadata: Metadata = {
  title: "Venue Research | 행사장 리서치 서비스",
  description: "조건에 맞는 행사장을 찾고, 실제 행사 레퍼런스를 근거로 추천합니다."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="font-body min-h-screen">
        <header className="border-b border-line bg-paper/80 backdrop-blur sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="font-display text-xl tracking-tight text-ink">
              Venue Research
            </Link>
            <nav className="text-sm text-subtle flex gap-6">
              <Link href="/" className="hover:text-ink transition-colors">
                검색
              </Link>
              <Link href="/admin" className="hover:text-ink transition-colors">
                관리자
              </Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
