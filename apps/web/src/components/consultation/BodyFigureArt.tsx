import {
  BODY_PATH,
  BODY_VIEWBOX,
  FACE_VIEWBOX,
  FACE_NECK_PATH,
  FACE_HEAD_PATH,
  FACE_FEATURE_PATHS,
} from "./bodyFigure";
import { type BodyMapView } from "@/lib/bodyMap";

/**
 * The figure artwork, one component for every renderer (annotator, tile
 * thumbnail, template part) — so the body and the face always draw
 * identically. Body = the PD silhouette (its source transform preserved —
 * the blank-map lesson); Face = RolDe's own serene front-face (v2.1).
 */
export const VIEW_DIMS: Record<BodyMapView, { w: number; h: number; viewBox: string }> = {
  anterior: { w: 970, h: 2200, viewBox: BODY_VIEWBOX },
  face: { w: 970, h: 1200, viewBox: FACE_VIEWBOX },
};

export function BodyFigureArt({ view }: { view: BodyMapView }) {
  if (view === "face") {
    return (
      <>
        <path d={FACE_NECK_PATH} fill="#E7E2D6" stroke="#C9C2B0" strokeWidth={4} />
        <path d={FACE_HEAD_PATH} fill="#E7E2D6" stroke="#C9C2B0" strokeWidth={4} />
        {FACE_FEATURE_PATHS.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke="#B3A88D"
            strokeWidth={7}
            strokeLinecap="round"
          />
        ))}
      </>
    );
  }
  return (
    <g transform="translate(41.500029,630.92312)">
      <path d={BODY_PATH} fill="#E7E2D6" stroke="#C9C2B0" strokeWidth={4} />
    </g>
  );
}
