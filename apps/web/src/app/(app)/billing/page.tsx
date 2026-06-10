import { Receipt } from "lucide-react";
import { ModuleStub } from "@/components/ModuleStub";

export default function BillingPage() {
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
