"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/Input";
import { PageLoader } from "@/components/ui/Spinner";
import { formatCurrency } from "@/lib/calculations";
import type { Category, Material } from "@/types";

interface MaterialPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (material: Material) => void;
}

export function MaterialPickerModal({ open, onClose, onSelect }: MaterialPickerModalProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.categories ?? []));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const timer = setTimeout(async () => {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      const res = await fetch(`/api/materials?${params.toString()}`);
      const data = await res.json();
      setMaterials(data.materials ?? []);
      setLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [open, search, categoryFilter]);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setCategoryFilter("all");
    }
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="Select Material" size="lg">
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <Input placeholder="Search materials by name or code..." value={search} onChange={(e) => setSearch(e.target.value)} autoFocus />
          </div>
          <div className="sm:w-52">
            <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto rounded-lg border border-slate-100 dark:border-slate-800">
          {loading ? (
            <PageLoader />
          ) : materials.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">No materials found</div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {materials.map((m) => (
                <li key={m.id}>
                  <button
                    onClick={() => {
                      onSelect(m);
                      onClose();
                    }}
                    className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800 dark:text-slate-100">{m.materialName}</span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          {m.materialCode}
                        </span>
                      </div>
                      <div className="truncate text-xs text-slate-400">
                        {m.category?.name ?? "Uncategorized"} {m.description ? `· ${m.description}` : ""}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{formatCurrency(m.sellingPrice)}</div>
                      <div className="text-xs text-slate-400">per {m.unit}</div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}
