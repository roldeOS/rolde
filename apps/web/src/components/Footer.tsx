import Link from "next/link";
import { Heart } from "lucide-react";

/**
 * Quiet footer for the auth surfaces (mindate pattern, Roland 2026-06-11):
 * a discreet Privacy · Terms · Contact row (W0.2) above "Made with ♥ at RolDe"
 * + the copyright line, centred. The legal links point at the PUBLIC
 * `/policy/*` pages so they work logged-out; Contact opens the team mailbox.
 * The in-app footer lives in the sidebar; this is for full-screen pages
 * (login / reset / policy) where there's no sidebar.
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
      <nav className="mt-2 flex items-center justify-center gap-2.5 text-[8px] text-muted-foreground/70">
        <Link href="/policy/privacy" className="transition-colors hover:text-foreground">
          Privacy
        </Link>
        <span aria-hidden>·</span>
        <Link href="/policy/terms" className="transition-colors hover:text-foreground">
          Terms
        </Link>
        <span aria-hidden>·</span>
        <a href="mailto:team@rolde.app" className="transition-colors hover:text-foreground">
          Contact
        </a>
      </nav>
    </footer>
  );
}
