"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/Spinner";
import { StatusBadge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { StatCard } from "@/components/dashboard/StatCard";
import { ClientFormModal } from "@/components/clients/ClientFormModal";
import { ClientStatusDistribution } from "@/components/clients/ClientStatusDistribution";
import { formatCurrency, formatDate } from "@/lib/calculations";
import { useToast } from "@/components/ToastProvider";
import type { Client } from "@/types";

export default function ClientDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/clients/${params.id}`);
      if (!res.ok) {
        setClient(null);
        return;
      }
      const data = await res.json();
      setClient(data.client);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function handleDelete() {
    if (!client) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/clients/${client.id}`, { method: "DELETE" });
      if (!res.ok) {
        showToast("Failed to delete client", "error");
        return;
      }
      showToast("Client deleted");
      router.push("/clients");
    } finally {
      setDeleteLoading(false);
    }
  }

  if (loading) return <PageLoader />;

  if (!client) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Client not found</p>
        <Link href="/clients" className="mt-2 inline-block text-sm text-brand-600 hover:underline">
          &larr; Back to Clients
        </Link>
      </div>
    );
  }

  const proposals = client.proposals ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/clients" className="text-sm font-medium text-brand-600 hover:underline">
            &larr; Back to Clients
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">{client.clientName}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {[client.company, client.contactPerson && `Attn: ${client.contactPerson}`, client.email, client.phone].filter(Boolean).join(" · ") || "No contact details on file"}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            Edit Client
          </Button>
          <Button variant="danger" onClick={() => setDeleteOpen(true)}>
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Proposals" value={String(client.totalProposals)} accent="brand" icon={<DocIcon className="h-6 w-6" />} />
        <StatCard label="Total Revenue" value={formatCurrency(client.totalRevenue)} accent="emerald" icon={<CoinIcon className="h-6 w-6" />} />
        <StatCard label="Last Proposal" value={client.lastProposalDate ? formatDate(client.lastProposalDate) : "—"} accent="amber" icon={<ClockIcon className="h-6 w-6" />} />
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Status Distribution</h2>
        </CardHeader>
        <CardBody>{client.statusDistribution && <ClientStatusDistribution distribution={client.statusDistribution} />}</CardBody>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Proposal History</h2>
          <Link href={`/proposals/new`} className="text-sm font-medium text-brand-600 hover:underline">
            + New Proposal
          </Link>
        </CardHeader>
        <CardBody>
          {proposals.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-400">No proposals for this client yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400 dark:border-slate-800">
                    <th className="py-3 pr-4 font-medium">Proposal #</th>
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
          )}
        </CardBody>
      </Card>

      <ClientFormModal open={editOpen} onClose={() => setEditOpen(false)} onSaved={load} client={client} />

      <ConfirmDialog
        open={deleteOpen}
        title="Delete Client"
        message={`Are you sure you want to delete "${client.clientName}"? Their existing proposals will be preserved but unlinked from this client record.`}
        confirmLabel="Delete"
        danger
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}

function DocIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
function CoinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8c-1.657 0-3 .672-3 1.5S10.343 11 12 11s3 .672 3 1.5-1.343 1.5-3 1.5m0-6c1.11 0 2.08.402 2.599 1M12 8V7m0 1v6m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
