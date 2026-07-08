import Link from "next/link";
import { StatusBadge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/calculations";
import type { Proposal } from "@/types";

export function RecentProposalsTable({ proposals }: { proposals: Proposal[] }) {
  if (proposals.length === 0) {
    return <div className="py-12 text-center text-sm text-slate-400">No proposals yet. Create your first proposal to get started.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400 dark:border-slate-800">
            <th className="py-3 pr-4 font-medium">Proposal #</th>
            <th className="py-3 pr-4 font-medium">Client</th>
            <th className="py-3 pr-4 font-medium">Event</th>
            <th className="py-3 pr-4 font-medium">Date</th>
            <th className="py-3 pr-4 font-medium text-right">Value</th>
            <th className="py-3 pr-4 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {proposals.map((p) => (
            <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <td className="py-3 pr-4">
                <Link href={`/proposals/${p.id}/edit`} className="font-mono text-xs font-medium text-brand-600 hover:underline">
                  {p.proposalNumber}
                </Link>
              </td>
              <td className="py-3 pr-4 font-medium text-slate-800 dark:text-slate-100">{p.clientName}</td>
              <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">{p.eventName}</td>
              <td className="py-3 pr-4 text-slate-500 dark:text-slate-400">{formatDate(p.createdAt)}</td>
              <td className="py-3 pr-4 text-right font-medium text-slate-800 dark:text-slate-100">{formatCurrency(p.grandTotal)}</td>
              <td className="py-3 pr-4">
                <StatusBadge status={p.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
