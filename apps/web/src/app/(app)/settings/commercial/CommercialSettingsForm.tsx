"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Receipt, PiggyBank, WalletCards, TicketPercent } from "lucide-react";
import { usePageActionBar, useSavedFlash } from "@/components/ui/PageActionBar";
import { Switch } from "@/components/ui/Switch";
import { CardIcon, type CardIconTone } from "@/components/ui/CardIcon";
import { Field, Input } from "@/components/ui/form";

export type CommercialSettings = {
  tax_enabled: boolean;
  tax_rate_bps: number;
  tax_name: string;
  tax_registration: string | null;
  tax_inclusive: boolean;
  deposit_enabled: boolean;
  deposit_default_pence: number;
  consult_credit_enabled: boolean;
  consult_credit_pence: number;
  consult_credit_label: string;
  discount_codes_enabled: boolean;
};

/**
 * Commercial Settings (W1.1.16) — the clinic's money policy, toggle-first. Each
 * card is a switch; its detail fields appear ONLY when it's on, so a tax-free,
 * deposit-free clinic sees a clean page. Saved through the shared pinned save-bar
 * (§1.12) — no in-page Save button. Money stored as pence, the tax rate as bps.
 * Tax v2: the tax is GLOBAL — its name (VAT · GST · Sales Tax), rate, registration
 * number and inclusive/exclusive pricing are all the clinic's own (roadmap §15.7).
 */
export function CommercialSettingsForm({ initial }: { initial: CommercialSettings }) {
  const router = useRouter();
  const flashSaved = useSavedFlash();

  const [taxOn, setTaxOn] = useState(initial.tax_enabled);
  const [taxRate, setTaxRate] = useState(trimPercent(initial.tax_rate_bps));
  const [taxName, setTaxName] = useState(initial.tax_name);
  const [taxReg, setTaxReg] = useState(initial.tax_registration ?? "");
  const [taxInclusive, setTaxInclusive] = useState(initial.tax_inclusive);
  const [depositOn, setDepositOn] = useState(initial.deposit_enabled);
  const [deposit, setDeposit] = useState(pounds(initial.deposit_default_pence));
  const [creditOn, setCreditOn] = useState(initial.consult_credit_enabled);
  const [credit, setCredit] = useState(pounds(initial.consult_credit_pence));
  const [creditLabel, setCreditLabel] = useState(initial.consult_credit_label);
  const [codesOn, setCodesOn] = useState(initial.discount_codes_enabled);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // What to call the tax in labels until they've typed their own (falls back calm).
  const taxLabel = taxName.trim() || "Tax";

  const payload = {
    tax_enabled: taxOn,
    tax_rate_bps: toBps(taxRate),
    tax_name: taxName.trim() || "Tax",
    tax_registration: taxReg.trim() || null,
    tax_inclusive: taxInclusive,
    deposit_enabled: depositOn,
    deposit_default_pence: toPence(deposit),
    consult_credit_enabled: creditOn,
    consult_credit_pence: toPence(credit),
    consult_credit_label: creditLabel.trim() || "Consultation Credit",
    discount_codes_enabled: codesOn,
  };

  const dirty =
    payload.tax_enabled !== initial.tax_enabled ||
    payload.tax_rate_bps !== initial.tax_rate_bps ||
    payload.tax_name !== (initial.tax_name || "Tax") ||
    payload.tax_registration !== (initial.tax_registration ?? null) ||
    payload.tax_inclusive !== initial.tax_inclusive ||
    payload.deposit_enabled !== initial.deposit_enabled ||
    payload.deposit_default_pence !== initial.deposit_default_pence ||
    payload.consult_credit_enabled !== initial.consult_credit_enabled ||
    payload.consult_credit_pence !== initial.consult_credit_pence ||
    payload.consult_credit_label !== initial.consult_credit_label ||
    payload.discount_codes_enabled !== initial.discount_codes_enabled;

  async function save() {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/settings/commercial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError("That didn’t save — try again.");
        return;
      }
      flashSaved("RolDe saved your commercial settings.");
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setSaving(false);
    }
  }

  usePageActionBar({ dirty, saving, onSave: save, error, saveLabel: "Save Changes" });

  return (
    <div className="space-y-4">
      {/* Tax — global & configurable (VAT · GST · Sales Tax · Tax) */}
      <ToggleCard
        icon={Receipt}
        tone="info"
        title="Tax"
        blurb="Charge tax on your services and show it on invoices — VAT, GST, sales tax, whatever applies where you practise."
        checked={taxOn}
        onChange={setTaxOn}
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tax Name" htmlFor="tax_name" hint="What it's called where you are">
              <Input
                id="tax_name"
                value={taxName}
                onChange={(e) => setTaxName(e.target.value)}
                placeholder="VAT"
                maxLength={20}
              />
            </Field>
            <Field label={`${taxLabel} Rate (%)`} htmlFor="tax_rate" hint="e.g. 20">
              <Input
                id="tax_rate"
                inputMode="decimal"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                placeholder="20"
              />
            </Field>
          </div>
          <Field
            label="Tax Registration Number"
            htmlFor="tax_reg"
            hint="Shown on invoices — your VAT no. / GSTIN (optional)"
          >
            <Input
              id="tax_reg"
              value={taxReg}
              onChange={(e) => setTaxReg(e.target.value)}
              placeholder="e.g. GB123456789"
              maxLength={40}
            />
          </Field>
          <label className="field-float flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5">
            <span className="text-sm">
              <span className="font-medium">Prices Include {taxLabel}</span>
              <span className="block text-xs text-muted-foreground">
                {taxInclusive
                  ? `Your service prices already include ${taxLabel} — patients pay the price shown.`
                  : `${taxLabel} is added on top of your prices at checkout.`}
              </span>
            </span>
            <Switch checked={taxInclusive} onChange={setTaxInclusive} label={`Prices Include ${taxLabel}`} />
          </label>
        </div>
      </ToggleCard>

      {/* Deposits */}
      <ToggleCard
        icon={PiggyBank}
        tone="warning"
        title="Deposits"
        blurb="Take a deposit when a patient books, netted off their final bill. You can override this per service later."
        checked={depositOn}
        onChange={setDepositOn}
      >
        <Field label="Default Deposit (£)" htmlFor="deposit" hint="0 for none">
          <Input
            id="deposit"
            inputMode="decimal"
            value={deposit}
            onChange={(e) => setDeposit(e.target.value)}
            placeholder="0.00"
            className="max-w-[10rem]"
          />
        </Field>
      </ToggleCard>

      {/* Consultation Credit */}
      <ToggleCard
        icon={WalletCards}
        tone="success"
        title="Consultation Credit"
        blurb="When a patient pays for a consultation, that amount becomes credit on their account — automatically applied to their next treatment."
        checked={creditOn}
        onChange={setCreditOn}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Credit Amount (£)" htmlFor="credit" hint="e.g. 50">
            <Input
              id="credit"
              inputMode="decimal"
              value={credit}
              onChange={(e) => setCredit(e.target.value)}
              placeholder="50.00"
            />
          </Field>
          <Field label="What Patients See It Called" htmlFor="credit_label">
            <Input
              id="credit_label"
              value={creditLabel}
              onChange={(e) => setCreditLabel(e.target.value)}
              placeholder="Consultation Credit"
              maxLength={60}
            />
          </Field>
        </div>
      </ToggleCard>

      {/* Discount Codes */}
      <ToggleCard
        icon={TicketPercent}
        tone="brand"
        title="Discount Codes"
        blurb="Run seasonal offers with codes patients enter at checkout — percentage or fixed, with usage limits and expiry."
        checked={codesOn}
        onChange={setCodesOn}
      >
        <p className="rounded-lg bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground">
          The codes themselves are created in Billing when the payments module ships. This switch
          turns the feature on so it’s ready.
        </p>
      </ToggleCard>

      {error && (
        <p className="rounded-lg bg-critical/10 px-3 py-2 text-xs font-medium text-critical">
          {error}
        </p>
      )}
    </div>
  );
}

function ToggleCard({
  icon,
  tone,
  title,
  blurb,
  checked,
  onChange,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: CardIconTone;
  title: string;
  blurb: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-card p-5 shadow-float">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <CardIcon icon={icon} tone={tone} variant="badge" size="md" />
          <div>
            <h2 className="font-heading text-base font-semibold tracking-tight">{title}</h2>
            <p className="mt-0.5 max-w-prose text-sm text-muted-foreground">{blurb}</p>
          </div>
        </div>
        <Switch checked={checked} onChange={onChange} label={title} />
      </div>
      {checked && <div className="mt-4 border-t border-border/60 pt-4">{children}</div>}
    </div>
  );
}

// — money/rate helpers. Pence + basis-points in, display strings out (and back). —
const pounds = (pence: number) => (pence / 100).toFixed(2);
const toPence = (s: string) => Math.max(0, Math.round((parseFloat(s) || 0) * 100));
// Tax rate display drops a trailing ".00" so 20% reads "20", not "20.00".
const trimPercent = (bps: number) => String(bps / 100);
const toBps = (s: string) => Math.min(10000, Math.max(0, Math.round((parseFloat(s) || 0) * 100)));
