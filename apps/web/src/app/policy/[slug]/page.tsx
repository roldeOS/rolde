import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getLegalDoc, STATUS_PILL, STATUS_LABEL } from "@/lib/legal";
import { getDbLegalDoc } from "@/lib/legalDb";
import { CardIcon } from "@/components/ui/CardIcon";
import { LegalDocBody } from "@/components/LegalDocBody";
import { Footer } from "@/components/Footer";

/**
 * PUBLIC legal page (W0.2) — reachable without a session (the proxy allowlists
 * `/policy/*`), so the login-footer Privacy / Terms links work for logged-out
 * visitors. Renders one document from the shared `@/lib/legal` source — the same
 * list the in-app Legal & Safety surface uses. Scaffold copy; counsel before launch.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = getLegalDoc(slug);
  return { title: doc ? `${doc.title} · RolDe OS` : "RolDe OS" };
}

export default async function PolicyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // Public visitors see only the PUBLISHED version (RLS-enforced), read live
  // from the DB so a Custodian's published edits show here immediately.
  const doc = await getDbLegalDoc(slug);
  if (!doc) notFound();
  const version = doc.versions.find((v) => v.status === "current") ?? doc.versions[0];
  if (!version) notFound();

  return (
    <main className="relative flex min-h-dvh flex-col items-center px-6 py-12">
      <div className="w-full max-w-2xl flex-1 space-y-8">
        <Link href="/login" className="flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/wordmark-roldeos.svg" alt="RolDe OS" className="h-10 w-auto" />
        </Link>

        <article className="w-full rounded-xl bg-card p-8 shadow-float">
          <div className="flex items-start gap-3">
            <CardIcon icon={doc.icon} tone={doc.tone} variant="badge" size="md" />
            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-tight">{doc.title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{doc.summary}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/60 pt-4 text-xs text-muted-foreground">
            <span
              className={`rounded-md px-2 py-0.5 font-medium ${STATUS_PILL[version.status]}`}
            >
              {STATUS_LABEL[version.status]}
            </span>
            <span className="font-medium text-foreground">{version.v}</span>
            <span aria-hidden>·</span>
            <span>Effective {version.date}</span>
          </div>

          <div className="mt-4">
            <LegalDocBody version={version} />
          </div>

          {version.status === "draft" && (
            <p className="mt-6 rounded-lg bg-warning/8 px-3 py-2 text-xs text-warning">
              Working draft — the in-force v1.0 is being finalised and will be
              published here.
            </p>
          )}
        </article>

        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back To Sign In
        </Link>
      </div>
      <Footer />
    </main>
  );
}
