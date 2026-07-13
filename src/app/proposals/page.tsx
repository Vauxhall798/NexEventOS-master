"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { PageLoader } from "@/components/ui/Spinner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ProposalStatusSelect } from "@/components/proposals/ProposalStatusSelect";
import { formatCurrency, formatDate } from "@/lib/calculations";
import { PROPOSAL_STATUSES, PROPOSAL_STATUS_LABELS } from "@/lib/proposalStatus";
import { useToast } from "@/components/ToastProvider";
import type { Proposal } from "@/types";

export default function ProposalHistoryPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleting, setDeleting] = useState<Proposal | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const { showToast } = useToast();
  const router = useRouter();

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/proposals?${params.toString()}`);
      const data = await res.json();
      setProposals(data.proposals ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/proposals/${deleting.id}`, { method: "DELETE" });
      if (!res.ok) {
        showToast("Failed to delete proposal", "error");
        return;
      }
      showToast("Proposal deleted");
      router.refresh();
      setDeleting(null);
      load();
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleDuplicate(id: string) {
    setDuplicatingId(id);
    try {
      const res = await fetch(`/api/proposals/${id}/duplicate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        showToast("Failed to duplicate proposal", "error");
        return;
      }
      showToast("Proposal duplicated");
      router.refresh();
      router.push(`/proposals/${data.proposal.id}/edit`);
    } finally {
      setDuplicatingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Proposal History</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{proposals.length} proposals</p>
        </div>
        <Link href="/proposals/new">
          <Button>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Proposal
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <Input placeholder="Search by client, proposal number, or event..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="sm:w-52">
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              {PROPOSAL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {PROPOSAL_STATUS_LABELS[s]}
                </option>
              ))}
            </Select>
          </div>
        </CardHeader>
        <CardBody>
          {loading ? (
            <PageLoader />
          ) : proposals.length === 0 ? (
            <div className="py-16 text-center text-sm text-slate-400">No proposals found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400 dark:border-slate-800">
                    <th className="py-3 pr-4 font-medium">Proposal #</th>
                    <th className="py-3 pr-4 font-medium">Client</th>
                    <th className="py-3 pr-4 font-medium">Event</th>
                    <th className="py-3 pr-4 font-medium">Event Date</th>
                    <th className="py-3 pr-4 font-medium text-right">Value</th>
                    <th className="py-3 pr-4 font-medium">Status</th>
                    <th className="py-3 pr-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {proposals.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-3 pr-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                        {p.proposalNumber}
                        {!p.isReviewed && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-red-600 text-white text-[10px] px-2 py-0.5 font-medium">NEW</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="font-medium text-slate-800 dark:text-slate-100">{p.clientName}</div>
                        {p.company && <div className="text-xs text-slate-400">{p.company}</div>}
                      </td>
                      <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">{p.eventName}</td>
                      <td className="py-3 pr-4 text-slate-500 dark:text-slate-400">{formatDate(p.eventDate)}</td>
                      <td className="py-3 pr-4 text-right font-medium text-slate-800 dark:text-slate-100">{formatCurrency(p.grandTotal)}</td>
                      <td className="py-3 pr-4">
                        <ProposalStatusSelect
                          id={p.id}
                          status={p.status}
                          onChanged={(status) => setProposals((prev) => prev.map((pr) => (pr.id === p.id ? { ...pr, status } : pr)))}
                        />
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex justify-end gap-1">
                          <Link href={`/proposals/${p.id}/preview`} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800" title="Preview">
                            <EyeIcon className="h-4 w-4" />
                          </Link>
                          <Link href={`/proposals/${p.id}/edit`} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800" title="Edit">
                            <EditIcon className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDuplicate(p.id)}
                            disabled={duplicatingId === p.id}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600 disabled:opacity-50 dark:hover:bg-slate-800"
                            title="Duplicate"
                          >
                            <CopyIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleting(p)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                            title="Delete"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <ConfirmDialog
        open={!!deleting}
        title="Delete Proposal"
        message={`Are you sure you want to delete proposal "${deleting?.proposalNumber}"? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

function EyeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
function EditIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}
function CopyIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7V5a2 2 0 012-2h9a2 2 0 012 2v9a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-2M8 7h8v8H8V7z" />
    </svg>
  );
}
function TrashIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}
