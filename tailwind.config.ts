import type { Config } from "tailwindcss";

// 디자인 토큰: "신뢰할 수 있는 공간 리서치" 컨셉
// 배경: 따뜻한 알라바스터 / 텍스트: 짙은 잉크 / 주색: 딥 틸(공간·신뢰) / 강조: 머스터드 골드(추천점수·근거뱃지)
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        paper: "#F6F4EF",
        ink: "#16181C",
        muted: "#8B8981",
        subtle: "#78766F",
        line: "#E4E0D4",
        teal: {
          50: "#EAF2F1",
          100: "#CFE3E1",
          400: "#276B65",
          600: "#0B4F4A",
          700: "#08403C"
        },
        gold: {
          100: "#F3E7C4",
          400: "#C9A227",
          600: "#9C7C1B"
        },
        signal: {
          high: "#0B4F4A",
          medium: "#B8860B",
          low: "#8A8778"
        }
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"]
      },
      borderRadius: {
        card: "14px"
      },
      boxShadow: {
        card: "0 1px 2px rgba(22,24,28,0.04), 0 8px 24px rgba(22,24,28,0.06)"
      }
    }
  },
  plugins: []
};

export default config;
