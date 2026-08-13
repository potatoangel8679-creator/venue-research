import Link from "next/link";
import Image from "next/image";
import { VenueSearchResult } from "@/types";

export function VenueCard({ result }: { result: VenueSearchResult }) {
  const { venue, score, matchedEventCount, reason } = result;

  const photoUrl = "/placeholder-venue.svg"; // 실제 사진은 venue_photos 테이블에서 가져와 교체합니다.

  return (
    <Link
      href={`/venue/${venue.id}`}
      className="group block bg-white rounded-card border border-line shadow-card overflow-hidden transition-transform hover:-translate-y-0.5"
    >
      <div className="relative h-44 bg-teal-50">
        <Image src={photoUrl} alt={venue.name} fill className="object-cover" />
        <div className="absolute top-3 right-3 bg-ink/85 text-white text-xs font-medium px-2.5 py-1 rounded-full">
          추천도 {score}%
        </div>
      </div>

      <div className="p-5">
        <h3 className="font-display text-lg text-ink">{venue.name}</h3>
        <p className="text-sm text-subtle mt-0.5">{venue.region ?? "지역 확인 필요"}</p>

        <dl className="mt-3 grid grid-cols-2 gap-y-1 text-sm text-ink/80">
          <dt className="text-subtle">수용 인원</dt>
          <dd>{venue.max_capacity ? `최대 ${venue.max_capacity.toLocaleString()}명` : "정보 확인 필요"}</dd>
          <dt className="text-subtle">면적</dt>
          <dd>{venue.total_area_sqm ? `약 ${venue.total_area_sqm.toLocaleString()}㎡` : "정보 확인 필요"}</dd>
          <dt className="text-subtle">주요 용도</dt>
          <dd>{venue.primary_use?.length ? venue.primary_use.join(" / ") : "정보 확인 필요"}</dd>
        </dl>

        <div className="mt-4 pt-4 border-t border-line flex items-center justify-between">
          <span className="text-xs text-teal-600 font-medium">
            확인된 행사 레퍼런스 {matchedEventCount}건
          </span>
        </div>

        <p className="mt-2 text-xs text-subtle leading-relaxed">{reason}</p>
      </div>
    </Link>
  );
}
