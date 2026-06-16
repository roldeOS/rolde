import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Footer } from "@/components/Footer";

/**
 * App-wide 404. Without this, `notFound()` (the custodian gate, unknown policy
 * slugs, missing records) leaves the root loading skeleton stuck. Standalone,
 * calm, matches the auth surfaces.
 */
export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-8">
        <Link href="/" className="flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/wordmark-roldeos.svg" alt="RolDe OS" className="h-12 w-auto" />
        </Link>
        <div className="rounded-xl bg-card p-8 text-center shadow-float">
          <h1 className="text-xl font-semibold tracking-tight">Page Not Found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We couldn’t find that page — it may have moved, or you may not have access to it.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Back Home
          </Link>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0">
        <Footer />
      </div>
    </main>
  );
}
