import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { LETTER_TITLES } from "@/lib/letters";
import { openLetter } from "./actions";

/**
 * The Courier secure viewer (C3) — where a sent letter is actually read. PUBLIC
 * route (proxy lists it), but nothing renders without a live capability token:
 * possession of the long-random link is the authorisation, exactly one letter
 * per token, expiring. Two steps by design: the ENVELOPE first (so an email
 * scanner's GET never sees clinical content and never fakes an open), then the
 * letter once a human presses Open Letter — that press is the Opened signal
 * the clinic sees on the letter's tile.
 */
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "A Letter via RolDe Courier",
  robots: { index: false, follow: false },
};

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-6 py-12">
      <div className="flex flex-col items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/wordmark-roldeos.svg" alt="RolDe OS" className="h-10 w-auto" />
        <p className="text-sm font-medium text-muted-foreground">Delivered by RolDe Courier</p>
      </div>
      {children}
      <p className="max-w-md text-center text-xs text-muted-foreground">
        This is a secure, personal link to one clinical letter. Please don&apos;t forward it —
        anyone holding the link can read the letter until it expires.
      </p>
    </main>
  );
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <div className="w-full max-w-md rounded-xl bg-card p-8 text-center shadow-float">
      <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

export default async function CourierViewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: d } = await admin
    .from("courier_dispatches")
    .select(
      "id, tenant_id, entry_id, recipient_name, status, opened_at, token_expires_at, sent_at",
    )
    .eq("view_token", token)
    .maybeSingle();

  if (!d) {
    return (
      <Shell>
        <Notice
          title="This Link Isn’t Valid"
          body="The address may be incomplete — check the link in your email, or ask the clinic to send the letter again."
        />
      </Shell>
    );
  }
  if (new Date(d.token_expires_at) < new Date()) {
    return (
      <Shell>
        <Notice
          title="This Link Has Expired"
          body="For safety, letter links only live for a while. Ask the clinic to send the letter again and a fresh link will arrive."
        />
      </Shell>
    );
  }

  const [{ data: entry }, { data: tenant }] = await Promise.all([
    admin
      .from("patient_feed_entries")
      .select("entry_type, payload, created_at, created_by")
      .eq("id", d.entry_id)
      .is("deleted_at", null)
      .maybeSingle(),
    admin.from("tenants").select("name").eq("id", d.tenant_id).maybeSingle(),
  ]);
  const title = entry ? LETTER_TITLES[entry.entry_type] : undefined;
  if (!entry || !title) {
    return (
      <Shell>
        <Notice
          title="This Letter Isn’t Available"
          body="The letter behind this link is no longer available. Ask the clinic if you were expecting it."
        />
      </Shell>
    );
  }

  const clinicName = tenant?.name ?? "the clinic";

  // ── The envelope — until a human presses Open Letter, no clinical content ──
  if (!d.opened_at) {
    const open = openLetter.bind(null, token);
    return (
      <Shell>
        <div className="w-full max-w-md rounded-xl bg-card p-8 text-center shadow-float">
          <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            {clinicName}
          </p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight">
            A {title} For {d.recipient_name}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {clinicName} has sent you a {title.toLowerCase()} to read securely. The clinic is
            told when it&apos;s been opened.
          </p>
          <form action={open} className="mt-6">
            <button
              type="submit"
              className="w-full rounded-lg bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
            >
              Open Letter
            </button>
          </form>
        </div>
      </Shell>
    );
  }

  // ── The letter — opened; the clinic's tile has already gone green ─────────
  const bodyText = String((entry.payload as { text?: string } | null)?.text ?? "").trim();
  const letterDate = new Date(entry.created_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Shell>
      <div className="w-full max-w-2xl rounded-xl bg-card p-8 shadow-float sm:p-10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              {clinicName}
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">{letterDate}</p>
          </div>
          <a
            href={`/courier/view/${token}/pdf`}
            className="rounded-lg bg-foreground px-3.5 py-2 text-xs font-semibold text-background transition-opacity hover:opacity-90"
          >
            Download PDF
          </a>
        </div>
        <div className="mt-6 border-t border-border pt-6">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{bodyText}</p>
        </div>
      </div>
    </Shell>
  );
}
