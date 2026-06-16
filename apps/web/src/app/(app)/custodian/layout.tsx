import { requireCustodian } from "@/lib/auth";

/**
 * The Custodian console (`/custodian/*`) — platform-level, cross-tenant surfaces
 * for RolDe (Roland). Gated to Custodians only; everyone else gets a 404. The
 * full standalone console (separate chrome + mandatory MFA + 4h timeout) is
 * W1.5.2 — this first slice reuses the app shell.
 */
export default async function CustodianLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireCustodian();
  return <>{children}</>;
}
