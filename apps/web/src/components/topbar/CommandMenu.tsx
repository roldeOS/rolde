"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, CornerDownLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Hit = {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
};

/**
 * Universal search — a ⌘K command palette wired to patients (RLS-scoped, so a
 * clinic only ever finds its own). Fully functional; more entities (notes,
 * letters, settings) plug in as those modules land.
 */
export function CommandMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQ("");
    setHits([]);
  }, []);

  // ⌘K / Ctrl-K to open.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [close]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 10);
  }, [open]);

  // Debounced patient search.
  useEffect(() => {
    if (!open) return;
    const term = q.trim();
    if (term.length < 1) {
      setHits([]);
      return;
    }
    const t = setTimeout(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("patients")
        .select("id, first_name, last_name, date_of_birth")
        .is("deleted_at", null)
        .or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%`)
        .order("last_name")
        .limit(8);
      setHits(data ?? []);
      setActive(0);
    }, 150);
    return () => clearTimeout(t);
  }, [q, open]);

  function go(hit: Hit) {
    close();
    router.push(`/patients/${hit.id}`);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-8 items-center gap-2 rounded-lg bg-card/70 px-2.5 text-sm text-muted-foreground shadow-sm ring-1 ring-black/[0.05] transition-all hover:bg-hover hover:shadow"
      >
        <Search className="size-4" />
        <span className="hidden sm:inline">Search…</span>
        <kbd className="hidden rounded bg-muted px-1 text-[10px] sm:inline">⌘K</kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center bg-foreground/25 p-4 pt-[14vh] backdrop-blur-sm"
          onClick={close}
        >
          <div
            className="w-full max-w-xl overflow-hidden rounded-2xl bg-card shadow-overlay"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-border/50 px-3.5">
              <Search className="size-4 text-muted-foreground" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown")
                    setActive((a) => Math.min(a + 1, hits.length - 1));
                  if (e.key === "ArrowUp") setActive((a) => Math.max(a - 1, 0));
                  if (e.key === "Enter" && hits[active]) go(hits[active]);
                }}
                placeholder="Search patients…"
                className="h-11 flex-1 bg-transparent text-sm outline-none"
              />
            </div>
            <div className="max-h-72 overflow-y-auto p-1.5">
              {hits.length === 0 ? (
                <p className="px-2.5 py-6 text-center text-xs text-muted-foreground">
                  {q.trim() ? "No patients found." : "Type to search patients."}
                </p>
              ) : (
                hits.map((h, i) => (
                  <button
                    key={h.id}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(h)}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-sm transition-colors ${
                      i === active ? "bg-hover" : ""
                    }`}
                  >
                    <span className="font-medium">
                      {h.last_name}, {h.first_name}
                    </span>
                    {i === active && (
                      <CornerDownLeft className="size-3.5 text-muted-foreground" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
