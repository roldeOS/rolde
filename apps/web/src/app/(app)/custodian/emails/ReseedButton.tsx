"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * "Re-seed From Code" — rebuilds the platform templates from `emails/seed.ts`
 * (the canonical source). Idempotent; refreshes the list on success.
 */
export function ReseedButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function reseed() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/email-templates/reseed", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (data.ok) {
        setMsg(`Re-seeded · ${data.inserted} inserted, ${data.updated} updated`);
        router.refresh();
      } else {
        setMsg(data.error ?? "Re-seed failed");
      }
    } catch {
      setMsg("Re-seed failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button onClick={reseed} disabled={loading} variant="outline" size="sm">
        <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
        {loading ? "Re-seeding…" : "Re-seed From Code"}
      </Button>
      {msg && <span className="text-xs text-muted-foreground">{msg}</span>}
    </div>
  );
}
