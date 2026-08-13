import { ConfidenceLevel } from "@/types";
import clsx from "clsx";

const LABEL: Record<ConfidenceLevel, string> = {
  high: "신뢰도 높음",
  medium: "신뢰도 보통",
  low: "신뢰도 낮음"
};

export function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        level === "high" && "badge-confidence-high",
        level === "medium" && "badge-confidence-medium",
        level === "low" && "badge-confidence-low"
      )}
    >
      {LABEL[level]}
    </span>
  );
}
