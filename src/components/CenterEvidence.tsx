import { ExternalLink, Phone } from "lucide-react";
import { centerDetails } from "../data/centers";
import { sourceIsStale } from "../lib/centers";
import type { Center } from "../data/types";

export default function CenterEvidence({
  center,
  now = new Date(),
}: {
  center: Center;
  now?: Date;
}) {
  const details = centerDetails[center.id];
  if (!details)
    return <p>Source unavailable. Confirm details before visiting.</p>;
  return (
    <div
      className="center-evidence"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="center-source-row">
        <span className="center-evidence-badge">{details.evidence}</span>
        <span>
          {sourceIsStale(details.checkedAt, now)
            ? "Source needs rechecking"
            : `Source checked ${details.checkedAt}`}
        </span>
      </div>
      <p>
        {center.type === "recycling"
          ? "Typical dry-waste materials · confirm site acceptance."
          : "Call to confirm your device before visiting."}
      </p>
      <div className="center-source-links">
        <a
          href={details.sourceUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={`${details.sourceLabel} for ${center.name}`}
        >
          View source <ExternalLink size={12} />
        </a>
        {details.phone && (
          <a href={`tel:${details.phone}`} aria-label={`Call ${center.name}`}>
            <Phone size={12} /> Call center
          </a>
        )}
      </div>
      <details>
        <summary>Before you go</summary>
        <p>{details.note}</p>
        <p>
          {details.coordinateNote}{" "}
          {details.mapUpdatedAt &&
            `Map record last edited ${details.mapUpdatedAt}.`}
        </p>
        <a href={details.materialsSourceUrl} target="_blank" rel="noreferrer">
          {details.materialsSourceLabel} <ExternalLink size={12} />
        </a>
      </details>
    </div>
  );
}
