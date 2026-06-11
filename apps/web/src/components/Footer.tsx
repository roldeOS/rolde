import { Heart } from "lucide-react";

/**
 * Quiet footer for the auth surfaces (mindate pattern, Roland 2026-06-11):
 * "Made with ♥ at RolDe" (amber-red heart) + the copyright line, centred.
 * The in-app footer lives in the sidebar; this is for full-screen pages
 * (login etc.) where there's no sidebar.
 */
export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="w-full py-6 text-center text-xs text-muted-foreground">
      <p className="inline-flex items-center gap-1">
        Made with
        <Heart aria-label="love" className="size-3 fill-[#e0533f] text-[#e0533f]" />
        at RolDe
      </p>
      <p className="mt-1">© {year} RolDe Ltd</p>
    </footer>
  );
}
