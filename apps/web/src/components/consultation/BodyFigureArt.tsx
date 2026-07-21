import { BODY_PATH } from "./bodyFigure";
import { type BodyMapView, type BodyMapFigure } from "@/lib/bodyMap";

/**
 * The figure artwork resolver — ONE authority for every renderer (annotator,
 * tile thumbnail, template part).
 *
 * v3 (2026-07-21): Roland's OWN rights-owned figure set — professional
 * medical-illustration WebP images (face · body · back, woman + man), served
 * self-hosted from /public/bodymap. Every NEW map names its figure.
 *
 * THE RECORDS LAW: maps saved BEFORE the figure era carry no `figure` — they
 * render on the ORIGINAL artwork (the PD silhouette / the v7 face portrait)
 * because their pin coordinates belong to that geometry. A clinical record is
 * never re-projected onto new art.
 */
export type FigureArtKey = `${BodyMapView}-${BodyMapFigure}`;

/** Real pixel dimensions of each asset — the viewBox IS the image space. */
export const FIGURE_ASSETS: Record<FigureArtKey, { w: number; h: number; href: string }> = {
  "face-woman": { w: 1301, h: 2000, href: "/bodymap/face-woman.webp" },
  "face-man": { w: 1321, h: 2000, href: "/bodymap/face-man.webp" },
  "anterior-woman": { w: 648, h: 2000, href: "/bodymap/body-woman.webp" },
  "anterior-man": { w: 649, h: 2000, href: "/bodymap/body-man.webp" },
  "posterior-woman": { w: 650, h: 2000, href: "/bodymap/back-woman.webp" },
  "posterior-man": { w: 650, h: 2000, href: "/bodymap/back-man.webp" },
};

const LEGACY_DIMS: Record<"anterior" | "face", { w: number; h: number }> = {
  anterior: { w: 970, h: 2200 },
  face: { w: 970, h: 1200 },
};

export type FigureArt = {
  /** Pre-figure map → original artwork (coordinates belong to it). */
  legacy: boolean;
  w: number;
  h: number;
  viewBox: string;
  href?: string;
};

export function resolveFigureArt(data: { view: BodyMapView; figure?: BodyMapFigure }): FigureArt {
  if (data.figure) {
    const key: FigureArtKey = `${data.view}-${data.figure}`;
    const a = FIGURE_ASSETS[key] ?? FIGURE_ASSETS["anterior-woman"];
    return { legacy: false, w: a.w, h: a.h, viewBox: `0 0 ${a.w} ${a.h}`, href: a.href };
  }
  const d = LEGACY_DIMS[data.view === "face" ? "face" : "anterior"];
  return { legacy: true, w: d.w, h: d.h, viewBox: `0 0 ${d.w} ${d.h}` };
}

export function BodyFigureArt({ art, view }: { art: FigureArt; view: BodyMapView }) {
  if (!art.legacy && art.href) {
    return <image href={art.href} x={0} y={0} width={art.w} height={art.h} />;
  }
  if (view === "face") return <LegacyFacePortrait />;
  return (
    <g transform="translate(41.500029,630.92312)">
      <path d={BODY_PATH} fill="#E7E2D6" stroke="#C9C2B0" strokeWidth={4} />
    </g>
  );
}

/** The v7 hand-crafted portrait — kept verbatim so pre-figure face maps
 *  render exactly as they were recorded. */
function LegacyFacePortrait() {
  return (
    <>
        <path d="M 312 660 L 658 660 L 665 1200 L 305 1200 Z" fill="#EAE4D6"/>
        <path d="M 512 1080 C 556 1062 610 1056 655 1066" fill="none" stroke="#A6997C" strokeWidth="5" strokeLinecap="round" opacity="0.65"/>
        <path d="M 458 1080 C 414 1062 360 1056 315 1066" fill="none" stroke="#A6997C" strokeWidth="5" strokeLinecap="round" opacity="0.65"/>
        <path d="M 485 58 C 315 58 200 172 186 358 C 176 480 182 590 198 690 C 212 782 228 870 234 950 C 240 1040 238 1120 230 1200 L 352 1200 C 344 1115 340 1030 338 950 C 320 840 305 720 298 600 C 296 540 300 470 308 462 C 322 400 352 345 388 312 C 424 282 454 262 485 258 C 516 262 546 282 582 312 C 618 345 648 400 662 462 C 670 470 674 540 672 600 C 665 720 650 840 632 950 C 630 1030 626 1115 618 1200 L 740 1200 C 732 1120 730 1040 736 950 C 742 870 758 782 772 690 C 788 590 794 480 784 358 C 770 172 655 58 485 58 Z" fill="#D8CDB6" stroke="#B9AC90" strokeWidth="4"/>
        <path d="M 424 268 C 352 322 314 415 310 518 C 306 615 315 720 332 830" fill="none" stroke="#B9AC90" strokeWidth="4" strokeLinecap="round" opacity="0.55"/><path d="M 546 268 C 618 322 656 415 660 518 C 664 615 655 720 638 830" fill="none" stroke="#B9AC90" strokeWidth="4" strokeLinecap="round" opacity="0.55"/><path d="M 372 305 C 324 372 300 465 302 558" fill="none" stroke="#B9AC90" strokeWidth="4" strokeLinecap="round" opacity="0.55"/><path d="M 598 305 C 646 372 670 465 668 558" fill="none" stroke="#B9AC90" strokeWidth="4" strokeLinecap="round" opacity="0.55"/><path d="M 336 900 C 340 990 342 1090 340 1180" fill="none" stroke="#B9AC90" strokeWidth="4" strokeLinecap="round" opacity="0.55"/><path d="M 634 900 C 630 990 628 1090 630 1180" fill="none" stroke="#B9AC90" strokeWidth="4" strokeLinecap="round" opacity="0.55"/>
        <path d="M 485 254 C 446 258 408 276 372 308 C 322 353 290 420 281 498 C 275 575 290 650 315 708 C 340 768 380 822 426 856 C 448 872 467 880 485 880 C 503 880 522 872 544 856 C 590 822 630 768 655 708 C 680 650 695 575 689 498 C 680 420 648 353 598 308 C 562 276 524 258 485 254 Z" fill="#EAE4D6" stroke="#C9BFA8" strokeWidth="4"/>
        <path d="M 540 424 C 570 406 620 404 652 422 C 622 416 573 418 543 432 Z" fill="#A6997C" stroke="#A6997C" strokeWidth="3" strokeLinejoin="round"/>
        <path d="M 430 424 C 400 406 350 404 318 422 C 348 416 397 418 427 432 Z" fill="#A6997C" stroke="#A6997C" strokeWidth="3" strokeLinejoin="round"/>
        <path d="M 566 448 C 590 430 634 429 658 446" fill="none" stroke="#A6997C" strokeWidth="3.5" strokeLinecap="round" opacity="0.45"/>
        <path d="M 404 448 C 380 430 336 429 312 446" fill="none" stroke="#A6997C" strokeWidth="3.5" strokeLinecap="round" opacity="0.45"/>
        <path d="M 558 474 C 582 450 638 449 664 472" fill="none" stroke="#A6997C" strokeWidth="8" strokeLinecap="round"/>
        <path d="M 412 474 C 388 450 332 449 306 472" fill="none" stroke="#A6997C" strokeWidth="8" strokeLinecap="round"/>
        <path d="M 560 476 C 584 492 636 493 662 474" fill="none" stroke="#A6997C" strokeWidth="4" strokeLinecap="round" opacity="0.7"/>
        <path d="M 410 476 C 386 492 334 493 308 474" fill="none" stroke="#A6997C" strokeWidth="4" strokeLinecap="round" opacity="0.7"/>
        <path d="M 664 472 C 673 467 680 461 684 454" fill="none" stroke="#A6997C" strokeWidth="7" strokeLinecap="round"/>
        <path d="M 306 472 C 297 467 290 461 286 454" fill="none" stroke="#A6997C" strokeWidth="7" strokeLinecap="round"/>
        <circle cx="611" cy="472" r="17" fill="none" stroke="#A6997C" strokeWidth="4"/>
        <circle cx="359" cy="472" r="17" fill="none" stroke="#A6997C" strokeWidth="4"/>
        <circle cx="611" cy="472" r="6" fill="#A6997C"/>
        <circle cx="359" cy="472" r="6" fill="#A6997C"/>
        <path d="M 504 515 C 506 545 509 570 513 595" fill="none" stroke="#A6997C" strokeWidth="3.5" strokeLinecap="round" opacity="0.5"/>
        <path d="M 466 515 C 464 545 461 570 457 595" fill="none" stroke="#A6997C" strokeWidth="3.5" strokeLinecap="round" opacity="0.5"/>
        <path d="M 457 595 C 448 608 446 618 458 625 C 470 632 477 634 485 634 C 493 634 500 632 512 625 C 524 618 522 608 513 595" fill="none" stroke="#A6997C" strokeWidth="5" strokeLinecap="round"/>
        <path d="M 502 615 C 507 620 514 622 521 619" fill="none" stroke="#A6997C" strokeWidth="4.5" strokeLinecap="round"/>
        <path d="M 468 615 C 463 620 456 622 449 619" fill="none" stroke="#A6997C" strokeWidth="4.5" strokeLinecap="round"/>
        <path d="M 408 712 C 436 692 462 688 477 699 C 480 701 490 701 493 699 C 508 688 534 692 562 712 C 538 745 510 760 485 760 C 460 760 432 745 408 712 Z" fill="#D9A79B" stroke="#C08A7D" strokeWidth="4" strokeLinejoin="round"/>
        <path d="M 408 712 C 446 726 524 726 562 712" fill="none" stroke="#C08A7D" strokeWidth="4" strokeLinecap="round"/>
    </>
  );
}
