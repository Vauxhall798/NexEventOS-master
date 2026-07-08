"use client";

import { formatCurrency } from "@/lib/calculations";
import type { Material } from "@/types";

interface MaterialTableProps {
  materials: Material[];
  onEdit: (material: Material) => void;
  onDelete: (material: Material) => void;
}

export function MaterialTable({ materials, onEdit, onDelete }: MaterialTableProps) {
  if (materials.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No materials found</p>
        <p className="text-xs text-slate-400">Try adjusting your search or filters, or add a new material.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400 dark:border-slate-800">
            <th className="py-3 pr-4 font-medium">Code</th>
            <th className="py-3 pr-4 font-medium">Material Name</th>
            <th className="py-3 pr-4 font-medium">Category</th>
            <th className="py-3 pr-4 font-medium">Unit</th>
            <th className="py-3 pr-4 font-medium text-right">Cost Price</th>
            <th className="py-3 pr-4 font-medium text-right">Selling Price</th>
            <th className="py-3 pr-4 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {materials.map((m) => (
            <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <td className="py-3 pr-4 font-mono text-xs text-slate-500 dark:text-slate-400">{m.materialCode}</td>
              <td className="max-w-xs py-3 pr-4">
                <div className="truncate font-medium text-slate-800 dark:text-slate-100">{m.materialName}</div>
                {m.description && <div className="truncate text-xs text-slate-400">{m.description}</div>}
              </td>
              <td className="py-3 pr-4">
                <span className="inline-flex rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                  {m.category?.name ?? "Uncategorized"}
                </span>
                {m.subCategory && <div className="mt-0.5 text-xs text-slate-400">{m.subCategory}</div>}
              </td>
              <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">{m.unit}</td>
              <td className="py-3 pr-4 text-right text-slate-600 dark:text-slate-300">{formatCurrency(m.costPrice)}</td>
              <td className="py-3 pr-4 text-right font-medium text-slate-800 dark:text-slate-100">{formatCurrency(m.sellingPrice)}</td>
              <td className="py-3 pr-4">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => onEdit(m)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800"
                    aria-label="Edit material"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDelete(m)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                    aria-label="Delete material"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
