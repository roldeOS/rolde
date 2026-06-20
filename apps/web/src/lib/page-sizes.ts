/**
 * Page-size primitives — plain TS, importable from BOTH server + client.
 * The UI lives in `components/ui/table/PageSizeSelector.tsx` (client only).
 *
 * Ported from the mindate dashboard (URDS table standard). Hard cap at 500
 * rows per page — no "All"; narrow via the Filter modal for huge lists.
 */

export const PAGE_SIZES = [10, 20, 50, 100, 500] as const;
export type PageSize = (typeof PAGE_SIZES)[number];

export function isValidPageSize(n: number): n is PageSize {
  return (PAGE_SIZES as readonly number[]).includes(n);
}
