"use client";

import { Field, Input } from "@/components/ui/form";
import { Select } from "@/components/ui/Select";
import {
  VITALS_FIELDS,
  TEMP_UNIT_INDEX,
  sanitiseVital,
  vitalOk,
  type TempUnit,
  type ScribeTemplate,
  type TemplateAnswers,
} from "@/lib/scribeTemplates";
import { cn } from "@/lib/utils";

/**
 * The Scribe template FILLER (RolDe Scribe Templates T1, Roland 2026-07-04) —
 * Scribe morphs into this structured form in place; every part renders with
 * the house controls, and Save composes the answers into a clean readable
 * note (renderTemplate). No navigation, no modal — the doctor stays put.
 */
export function ScribeTemplateForm({
  template,
  answers,
  onChange,
  tempUnit = "c",
}: {
  template: ScribeTemplate;
  answers: TemplateAnswers;
  onChange: (index: number, value: string | string[] | number) => void;
  /** The clinic's default temperature unit (US → °F); flippable per note. */
  tempUnit?: TempUnit;
}) {
  return (
    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
      {template.parts.map((p, i) => {
        const a = answers[i];
        switch (p.kind) {
          case "heading":
            return (
              <p
                key={i}
                className="pt-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase"
              >
                {p.label}
              </p>
            );
          case "instruction":
            return (
              <p key={i} className="text-xs text-muted-foreground">
                {p.text}
              </p>
            );
          case "text":
            return (
              <Field key={i} label={p.label} htmlFor={`tp-${i}`}>
                <Input
                  id={`tp-${i}`}
                  value={typeof a === "string" ? a : ""}
                  placeholder={p.placeholder}
                  onChange={(e) => onChange(i, e.target.value)}
                />
              </Field>
            );
          case "vitals": {
            const vals = Array.isArray(a) ? a : [];
            const unit: TempUnit =
              String(vals[TEMP_UNIT_INDEX] ?? tempUnit) === "f" ? "f" : "c";
            const write = (mutate: (next: string[]) => void) => {
              const next = [...Array(VITALS_FIELDS.length + 1)].map((_, k) =>
                String(vals[k] ?? (k === TEMP_UNIT_INDEX ? unit : "")),
              );
              mutate(next);
              onChange(i, next);
            };
            return (
              <div key={i}>
                <p className="mb-1.5 text-xs font-semibold text-foreground">{p.label}</p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {VITALS_FIELDS.map((f, j) => (
                    <div key={f.key}>
                      <p className="mb-0.5 text-[10px] font-semibold text-muted-foreground">
                        {f.label}
                        {f.key === "temp" ? (
                          <button
                            type="button"
                            onClick={() =>
                              write((next) => {
                                next[TEMP_UNIT_INDEX] = unit === "c" ? "f" : "c";
                              })
                            }
                            title="Flip between Celsius and Fahrenheit"
                            className="ml-1 rounded bg-foreground/6 px-1 font-normal text-foreground/70 transition-colors hover:bg-foreground/10"
                          >
                            {unit === "f" ? "°F" : "°C"} ⇄
                          </button>
                        ) : (
                          f.unit && <span className="font-normal"> {f.unit}</span>
                        )}
                      </p>
                      <Input
                        value={String(vals[j] ?? "")}
                        placeholder={f.key === "temp" && unit === "f" ? "98.6" : f.placeholder}
                        inputMode="decimal"
                        maxLength={f.key === "temp" && unit === "f" ? 5 : f.maxLen}
                        error={!vitalOk(f.key, String(vals[j] ?? ""), unit)}
                        onChange={(e) =>
                          write((next) => {
                            next[j] = sanitiseVital(f.key, e.target.value);
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          }
          case "date":
            return (
              <Field key={i} label={p.label} htmlFor={`tp-${i}`}>
                <Input
                  id={`tp-${i}`}
                  type="date"
                  value={typeof a === "string" ? a : ""}
                  onChange={(e) => onChange(i, e.target.value)}
                />
              </Field>
            );
          case "textarea":
            return (
              <Field key={i} label={p.label} htmlFor={`tp-${i}`}>
                <textarea
                  id={`tp-${i}`}
                  value={typeof a === "string" ? a : ""}
                  placeholder={p.placeholder}
                  rows={3}
                  onChange={(e) => onChange(i, e.target.value)}
                  className="w-full resize-y rounded-lg bg-muted/40 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:bg-muted/60"
                />
              </Field>
            );
          case "checkboxes": {
            const selected = Array.isArray(a) ? a : [];
            return (
              <div key={i}>
                <p className="mb-1.5 text-xs font-semibold text-foreground">{p.label}</p>
                <div className="flex flex-wrap gap-1.5">
                  {p.options.map((opt) => {
                    const on = selected.includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() =>
                          onChange(
                            i,
                            on ? selected.filter((s) => s !== opt) : [...selected, opt],
                          )
                        }
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                          on
                            ? "bg-foreground text-background"
                            : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          }
          case "dropdown":
            return (
              <Field key={i} label={p.label} htmlFor={`tp-${i}`}>
                <Select
                  id={`tp-${i}`}
                  value={typeof a === "string" ? a : ""}
                  onChange={(v) => onChange(i, v)}
                >
                  <option value="">—</option>
                  {p.options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </Select>
              </Field>
            );
          case "range": {
            const val = typeof a === "number" ? a : undefined;
            return (
              <div key={i}>
                <p className="mb-1 flex items-center justify-between text-xs font-semibold text-foreground">
                  {p.label}
                  <span className="rounded-md bg-foreground/6 px-1.5 py-0.5 font-normal tabular-nums text-muted-foreground">
                    {val ?? "—"} / {p.max}
                  </span>
                </p>
                <input
                  type="range"
                  min={p.min}
                  max={p.max}
                  step={1}
                  value={val ?? p.min}
                  onChange={(e) => onChange(i, Number(e.target.value))}
                  className="w-full accent-foreground"
                />
                {(p.minLabel || p.maxLabel) && (
                  <p className="flex justify-between text-[10px] text-muted-foreground">
                    <span>{p.minLabel}</span>
                    <span>{p.maxLabel}</span>
                  </p>
                )}
              </div>
            );
          }
        }
      })}
    </div>
  );
}
