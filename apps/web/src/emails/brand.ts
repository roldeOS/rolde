/**
 * RolDe email brand constants — the single source for the email shell's colours,
 * wordmark, and legal footer. Mirrors the app: parchment paper, near-white card,
 * coral ♥, all-black text in light mode.
 *
 * Dark mode = a warm charcoal in parchment's hue family, with BRIGHT body text.
 * (mindate's hard-won fix, 2026-06-15: a muddy mid-tone like #c4baa8 reads as
 * "unreadable" in dark mode; ~#e8e0d4 lands ~10:1 on the dark card — AA+.)
 *
 * The wordmark is a hosted PNG (email clients can't render our SVG). Until the
 * RolDe OS PNGs ship, the shell falls back to serif text — set the two URLs
 * below once the assets are live and the shell swaps to the images automatically.
 */
export const EMAIL_BRAND = {
  // — Light —
  page: "#f0efeb", // parchment
  card: "#faf9f6", // near-white (NOT pure #fff: survives Apple Mail auto-invert)
  ink: "#0a0a0a", // headline + body + footer — near-black, "shiny" not drab
  muted: "#6b6a64",
  divider: "#efece7",
  heart: "#e0533f", // coral
  button: "#0a0a0a",
  buttonText: "#ffffff",
  // — Dark (Roland 2026-06-15: jet/glassy-black page, charcoal card that floats on it) —
  darkPage: "#0a0a0a", // jet black — the page/outer background
  darkCard: "#1f1f1f", // charcoal — a touch lighter than the page so the card floats
  darkInk: "#f5f4f2", // bright near-white — headline + wordmark
  darkBody: "#e6e3de", // BRIGHT readable body (the muddy-tan fix)
  darkMuted: "#9b9892", // footer fine print — visible on charcoal
  darkLink: "#e6e3de", // footer links — light so they're not black-on-dark
  darkDivider: "#2c2c2c",
  darkButton: "#f5f4f2",
  darkButtonText: "#0a0a0a",
  // — Assets (DESIGN-NEEDED: Roland to export RolDe OS PNGs, transparent) —
  wordmarkLightUrl: "", // black RolDe OS, e.g. https://rolde.app/brand/wordmark-roldeos.png
  wordmarkDarkUrl: "", // white RolDe OS, e.g. https://rolde.app/brand/wordmark-roldeos-dark.png
  // — Type + legal —
  font: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Inter,Helvetica,Arial,sans-serif",
  regLine: "Registered in England & Wales - 17210556",
  addressLine1: "71–75 Shelton Street, Covent Garden,",
  addressLine2: "London, WC2H 9JQ, UK",
  siteUrl: "https://rolde.app",
  contactEmail: "team@rolde.app",
} as const;
