"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/Input";
import type { Client } from "@/types";

interface ClientAutocompleteProps {
  value: string;
  onChange: (name: string) => void;
  onSelectClient: (client: Client) => void;
  error?: string;
}

/** Client Name field that suggests existing clients as you type (or on focus) — selecting one auto-fills the rest of the client details. */
export function ClientAutocomplete({ value, onChange, onSelectClient, error }: ClientAutocompleteProps) {
  const [results, setResults] = useState<Client[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(async () => {
      const params = value.trim() ? `?q=${encodeURIComponent(value.trim())}` : "";
      const res = await fetch(`/api/clients${params}`);
      const data = await res.json();
      setResults((data.clients ?? []).slice(0, 8));
    }, 200);
    return () => clearTimeout(timer);
  }, [open, value]);

  return (
    <div ref={containerRef} className="relative">
      <Input
        label="Client Name"
        required
        autoComplete="off"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        error={error}
      />
      {open && results.length > 0 && (
        <ul className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
          {results.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => {
                  onSelectClient(c);
                  setOpen(false);
                }}
                className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{c.clientName}</span>
                <span className="text-xs text-slate-400">{[c.company, c.email, c.phone].filter(Boolean).join(" · ") || "No additional details"}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
