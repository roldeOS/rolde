import { Mail } from "lucide-react";
import { ModuleStub } from "@/components/ModuleStub";
import { requireModuleAccess } from "@/lib/auth";

export default async function LettersPage() {
  await requireModuleAccess("letters");
  return (
    <ModuleStub
      icon={Mail}
      tone="neutral"
      title="Letters"
      blurb="Referrals, discharge summaries, GP letters and sick notes — with the closed-loop referral pipeline"
      source="Bible 4.4 §5–6"
    />
  );
}
