import { RoldeLoader } from "@/components/ui/RoldeLoader";

/**
 * Top-level boot loader — the brand "rolde" tracing animation, centred. Shown
 * while the very first route resolves (in-app navigations use the per-segment
 * skeletons instead).
 */
export default function RootLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <RoldeLoader className="h-12 w-auto" />
    </main>
  );
}
