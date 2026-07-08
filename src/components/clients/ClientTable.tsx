"use client";

import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/calculations";
import type { Client } from "@/types";

interface ClientTableProps {
  clients: Client[];
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
}

export function ClientTable({ clients, onEdit, onDelete }: ClientTableProps) {
  if (clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No clients found</p>
        <p className="text-xs text-slate-400">Clients are created automatically the first time you save a proposal for them.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400 dark:border-slate-800">
            <th className="py-3 pr-4 font-medium">Client</th>
            <th className="py-3 pr-4 font-medium">Contact</th>
            <th className="py-3 pr-4 font-medium text-right">Proposals</th>
            <th className="py-3 pr-4 font-medium text-right">Total Revenue</th>
            <th className="py-3 pr-4 font-medium">Last Proposal</th>
            <th className="py-3 pr-4 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {clients.map((c) => (
            <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <td className="max-w-xs py-3 pr-4">
                <Link href={`/clients/${c.id}`} className="block truncate font-medium text-slate-800 hover:text-brand-600 hover:underline dark:text-slate-100">
                  {c.clientName}
                </Link>
                {c.company && <div className="truncate text-xs text-slate-400">{c.company}</div>}
              </td>
              <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">
                {c.email && <div>{c.email}</div>}
                {c.phone && <div className="text-xs text-slate-400">{c.phone}</div>}
                {!c.email && !c.phone && <span className="text-slate-300 dark:text-slate-600">—</span>}
              </td>
              <td className="py-3 pr-4 text-right text-slate-600 dark:text-slate-300">{c.totalProposals}</td>
              <td className="py-3 pr-4 text-right font-medium text-slate-800 dark:text-slate-100">{formatCurrency(c.totalRevenue)}</td>
              <td className="py-3 pr-4 text-slate-500 dark:text-slate-400">{c.lastProposalDate ? formatDate(c.lastProposalDate) : "—"}</td>
              <td className="py-3 pr-4">
                <div className="flex justify-end gap-2">
                  <Link href={`/clients/${c.id}`} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800" title="View details">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </Link>
                  <button
                    onClick={() => onEdit(c)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800"
                    aria-label="Edit client"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDelete(c)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                    aria-label="Delete client"
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
