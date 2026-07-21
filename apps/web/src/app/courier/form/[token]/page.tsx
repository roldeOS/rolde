import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitiseParts } from "@/lib/scribeTemplates";
import { openFormRequest } from "./actions";
import { PublicFormFiller } from "./PublicFormFiller";

/**
 * The Courier secure FORM viewer (T4) — the letter-viewer law applied to
 * forms: PUBLIC route, capability token in the URL, ENVELOPE first (no form
 * content on a scanner's GET; a human's "Start The Form" press is the honest
 * Opened signal), then the frozen-snapshot form, then a calm thank-you.
 * Submitted forms never reopen.
 */
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "A Form Via RolDe Courier",
  robots: { index: false, follow: false },
};

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-4 py-10 sm:px-6">
      <div className="flex flex-col items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/wordmark-roldeos.svg" alt="RolDe OS" className="h-10 w-auto" />
        <p className="text-sm font-medium text-muted-foreground">Delivered by RolDe Courier</p>
      </div>
      {children}
      <p className="max-w-md text-center text-xs text-muted-foreground">
        This is a secure, personal link. Your answers go straight to your
        clinical record — nowhere else. Please don&apos;t forward this email or link.
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

export default async function CourierFormPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: r } = await admin
    .from("form_requests")
    .select(
      "id, tenant_id, template_snapshot, recipient_name, status, opened_at, submitted_at, token_expires_at",
    )
    .eq("view_token", token)
    .maybeSingle();

  if (!r) {
    return (
      <Shell>
        <Notice
          title="This Link Isn’t Valid"
          body="The address may be incomplete — check the link in your email, or ask the clinic to send the form again."
        />
      </Shell>
    );
  }
  if (r.status === "submitted") {
    return (
      <Shell>
        <Notice
          title="Thank You — Already Received"
          body="This form has been submitted and is with your clinical team. There's nothing more to do."
        />
      </Shell>
    );
  }
  if (new Date(r.token_expires_at) < new Date()) {
    return (
      <Shell>
        <Notice
          title="This Link Has Expired"
          body="For safety, form links only live for a while. Ask the clinic to send it again and a fresh link will arrive."
        />
      </Shell>
    );
  }

  const snap = r.template_snapshot as { name?: string; parts?: unknown } | null;
  const parts = snap?.parts ? sanitiseParts(snap.parts) : null;
  const { data: tenant } = await admin
    .from("tenants")
    .select("name")
    .eq("id", r.tenant_id)
    .maybeSingle();
  const clinicName = tenant?.name ?? "the clinic";
  if (!parts) {
    return (
      <Shell>
        <Notice
          title="This Form Isn’t Available"
          body="The form behind this link is no longer available. Ask the clinic if you were expecting it."
        />
      </Shell>
    );
  }

  // ── The envelope — no form content until a human presses Start ──────────
  if (!r.opened_at) {
    const open = openFormRequest.bind(null, token);
    return (
      <Shell>
        <div className="w-full max-w-md rounded-xl bg-card p-8 text-center shadow-float">
          <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            {clinicName}
          </p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight">
            {String(snap?.name ?? "A Form")} For {r.recipient_name}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {`${clinicName} has asked you to complete this short form. It takes a few minutes, and the clinic is told when it’s done.`}
          </p>
          <form action={open} className="mt-6">
            <button
              type="submit"
              className="w-full rounded-lg bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
            >
              Start The Form
            </button>
          </form>
        </div>
      </Shell>
    );
  }

  // ── The form itself — the frozen snapshot, filled client-side ───────────
  return (
    <Shell>
      <PublicFormFiller
        token={token}
        clinicName={clinicName}
        formName={String(snap?.name ?? "Form")}
        parts={parts}
      />
    </Shell>
  );
}
