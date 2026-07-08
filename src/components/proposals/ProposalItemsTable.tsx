"use client";

import { formatCurrency } from "@/lib/calculations";
import { Button } from "@/components/ui/Button";
import type { ProposalItem } from "@/types";

interface ProposalItemsTableProps {
  items: ProposalItem[];
  onChange: (id: string, patch: Partial<ProposalItem>) => void;
  onRemove: (id: string) => void;
  onAddItem: () => void;
  onAddCustomItem: () => void;
}

export function ProposalItemsTable({ items, onChange, onRemove, onAddItem, onAddCustomItem }: ProposalItemsTableProps) {
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-800">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-800/50">
              <th className="w-10 py-3 pl-4 font-medium">#</th>
              <th className="py-3 pr-4 font-medium">Material / Description</th>
              <th className="w-24 py-3 pr-4 font-medium">Unit</th>
              <th className="w-28 py-3 pr-4 font-medium text-right">Qty</th>
              <th className="w-32 py-3 pr-4 font-medium text-right">Rate</th>
              <th className="w-32 py-3 pr-4 font-medium text-right">Amount</th>
              <th className="w-10 py-3 pr-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-sm text-slate-400">
                  No materials added yet. Click &quot;+ Add Item&quot; to select from the material master, or &quot;+ Add Custom Item&quot; for something one-off.
                </td>
              </tr>
            )}
            {items.map((item, idx) => (
              <tr key={item.id}>
                <td className="py-2 pl-4 text-slate-400">{idx + 1}</td>
                <td className="py-2 pr-4">
                  <input
                    value={item.materialName}
                    onChange={(e) => onChange(item.id, { materialName: e.target.value })}
                    placeholder="Material / item name"
                    className="w-full rounded border border-transparent bg-transparent p-0 text-sm font-medium text-slate-800 focus:border-brand-500 focus:bg-white focus:px-1.5 focus:py-0.5 focus:outline-none focus:ring-1 focus:ring-brand-200 dark:text-slate-100 dark:focus:bg-slate-800"
                  />
                  <input
                    value={item.description ?? ""}
                    onChange={(e) => onChange(item.id, { description: e.target.value })}
                    placeholder="Description"
                    className="mt-1 w-full rounded border-none bg-transparent p-0 text-xs text-slate-400 focus:outline-none focus:ring-0"
                  />
                </td>
                <td className="py-2 pr-4">
                  <input
                    value={item.unit}
                    onChange={(e) => onChange(item.id, { unit: e.target.value })}
                    placeholder="Nos"
                    className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-800"
                  />
                </td>
                <td className="py-2 pr-4">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={item.quantity}
                    onChange={(e) => onChange(item.id, { quantity: Math.max(0, parseFloat(e.target.value) || 0) })}
                    className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-right text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-800"
                  />
                </td>
                <td className="py-2 pr-4">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.sellingPrice}
                    onChange={(e) => onChange(item.id, { sellingPrice: Math.max(0, parseFloat(e.target.value) || 0) })}
                    className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-right text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-800"
                  />
                </td>
                <td className="py-2 pr-4 text-right font-semibold text-slate-800 dark:text-slate-100">
                  {formatCurrency(item.sellingPrice * item.quantity)}
                </td>
                <td className="py-2 pr-4 text-right">
                  <button
                    onClick={() => onRemove(item.id)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                    aria-label="Remove item"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="outline" onClick={onAddItem}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Item
        </Button>
        <Button type="button" variant="ghost" onClick={onAddCustomItem}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Custom Item
        </Button>
      </div>
    </div>
  );
}
