"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { PageLoader } from "@/components/ui/Spinner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ClientTable } from "@/components/clients/ClientTable";
import { ClientFormModal } from "@/components/clients/ClientFormModal";
import { useToast } from "@/components/ToastProvider";
import type { Client } from "@/types";

export default function ClientListPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("recent");
  const [editing, setEditing] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState<Client | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { showToast } = useToast();

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (filter !== "all") params.set("filter", filter);
      params.set("sort", sort);
      const res = await fetch(`/api/clients?${params.toString()}`);
      const data = await res.json();
      setClients(data.clients ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filter, sort]);

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/clients/${deleting.id}`, { method: "DELETE" });
      if (!res.ok) {
        showToast("Failed to delete client", "error");
        return;
      }
      showToast("Client deleted");
      setDeleting(null);
      load();
    } finally {
      setDeleteLoading(false);
    }
  }

  const summary = useMemo(
    () => ({
      total: clients.length,
      totalRevenue: clients.reduce((sum, c) => sum + c.totalRevenue, 0),
    }),
    [clients]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Clients</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{summary.total} clients</p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <Input placeholder="Search by name, company, email, or phone..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="sm:w-48">
            <Select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All Clients</option>
              <option value="withProposals">With Proposals</option>
              <option value="noProposals">No Proposals Yet</option>
            </Select>
          </div>
          <div className="sm:w-48">
            <Select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="recent">Sort: Most Recent</option>
              <option value="name">Sort: Name</option>
              <option value="revenue">Sort: Revenue</option>
              <option value="proposals">Sort: Proposal Count</option>
            </Select>
          </div>
        </CardHeader>
        <CardBody>{loading ? <PageLoader /> : <ClientTable clients={clients} onEdit={setEditing} onDelete={setDeleting} />}</CardBody>
      </Card>

      <ClientFormModal open={!!editing} onClose={() => setEditing(null)} onSaved={load} client={editing} />

      <ConfirmDialog
        open={!!deleting}
        title="Delete Client"
        message={`Are you sure you want to delete "${deleting?.clientName}"? Their existing proposals will be preserved but unlinked from this client record.`}
        confirmLabel="Delete"
        danger
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
