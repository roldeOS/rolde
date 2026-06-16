import { Receipt } from "lucide-react";
import { ModuleStub } from "@/components/ModuleStub";
import { requireModuleAccess } from "@/lib/auth";

export default async function BillingPage() {
  await requireModuleAccess("billing");
  return (
    <ModuleStub
      icon={Receipt}
      tone="warning"
      title="Billing"
      blurb="Invoices, patient payments and Stripe Connect payouts"
      source="Bible 4.3 §4"
    />
  );
}
