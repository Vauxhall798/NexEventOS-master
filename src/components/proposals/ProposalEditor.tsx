"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { MaterialPickerModal } from "./MaterialPickerModal";
import { ClientAutocomplete } from "./ClientAutocomplete";
import { ProposalItemsTable } from "./ProposalItemsTable";
import { ProposalSummary } from "./ProposalSummary";
import { computeTotals } from "@/lib/calculations";
import { useToast } from "@/components/ToastProvider";
import type { Client, Material, Proposal, ProposalItem } from "@/types";

interface ProposalEditorProps {
  proposal?: Proposal;
  /** Company's configured default tax rate — seeds a new proposal's tax %. Ignored when editing. */
  defaultTaxPercent?: number;
}

interface FormState {
  clientName: string;
  company: string;
  contactPerson: string;
  email: string;
  phone: string;
  eventName: string;
  eventDate: string;
  venue: string;
  proposalDate: string;
  salesPersonName: string;
  notes: string;
}

function toDateInput(value: string | null | undefined): string {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function buildInitialForm(proposal?: Proposal): FormState {
  return {
    clientName: proposal?.clientName ?? "",
    company: proposal?.company ?? "",
    contactPerson: proposal?.contactPerson ?? "",
    email: proposal?.email ?? "",
    phone: proposal?.phone ?? "",
    eventName: proposal?.eventName ?? "",
    eventDate: toDateInput(proposal?.eventDate),
    venue: proposal?.venue ?? "",
    proposalDate: proposal ? toDateInput(proposal.proposalDate) : new Date().toISOString().slice(0, 10),
    salesPersonName: proposal?.salesPersonName ?? "Priya Sharma",
    notes: proposal?.notes ?? "",
  };
}

function makeTempId() {
  return `tmp-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

export function ProposalEditor({ proposal, defaultTaxPercent }: ProposalEditorProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const isEditing = !!proposal;

  const [form, setForm] = useState<FormState>(buildInitialForm(proposal));
  const [items, setItems] = useState<ProposalItem[]>(proposal?.items ?? []);
  const [discountPercent, setDiscountPercent] = useState(proposal?.discountPercent ?? 0);
  const [taxPercent, setTaxPercent] = useState(proposal?.taxPercent ?? defaultTaxPercent ?? 18);
  const [roundOff, setRoundOff] = useState(proposal?.roundOff ?? 0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState<"draft" | "save" | "preview" | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const totals = useMemo(
    () =>
      computeTotals({
        subtotal: items.reduce((sum, it) => sum + it.sellingPrice * it.quantity, 0),
        discountPercent,
        taxPercent,
        roundOff,
      }),
    [items, discountPercent, taxPercent, roundOff]
  );

  function update(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSelectClient(client: Client) {
    setForm((prev) => ({
      ...prev,
      clientName: client.clientName,
      company: client.company ?? "",
      contactPerson: client.contactPerson ?? "",
      email: client.email ?? "",
      phone: client.phone ?? "",
    }));
  }

  function handleSelectMaterial(material: Material) {
    setItems((prev) => [
      ...prev,
      {
        id: makeTempId(),
        materialId: material.id,
        materialName: material.materialName,
        description: material.description,
        unit: material.unit,
        sellingPrice: material.sellingPrice,
        quantity: 1,
        amount: material.sellingPrice,
        sortOrder: prev.length,
      },
    ]);
  }

  function handleAddCustomItem() {
    setItems((prev) => [
      ...prev,
      {
        id: makeTempId(),
        materialId: null,
        materialName: "",
        description: "",
        unit: "Nos",
        sellingPrice: 0,
        quantity: 1,
        amount: 0,
        sortOrder: prev.length,
      },
    ]);
  }

  function handleItemChange(id: string, patch: Partial<ProposalItem>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  function handleRemoveItem(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!form.clientName.trim()) next.clientName = "Client name is required";
    if (!form.eventName.trim()) next.eventName = "Event name is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSave(mode: "draft" | "save" | "preview") {
    if (!validate()) {
      showToast("Please fill in the required fields", "error");
      return;
    }

    setSaving(mode);
    try {
      const payload = {
        ...form,
        status: mode === "draft" ? "DRAFT" : isEditing ? proposal?.status : "SENT",
        discountPercent,
        taxPercent,
        roundOff,
        items: items.map((it) => ({
          materialId: it.materialId,
          materialName: it.materialName,
          description: it.description,
          unit: it.unit,
          sellingPrice: it.sellingPrice,
          quantity: it.quantity,
        })),
      };

      const res = await fetch(isEditing ? `/api/proposals/${proposal!.id}` : "/api/proposals", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || "Failed to save proposal", "error");
        return;
      }

      showToast(isEditing ? "Proposal updated" : "Proposal created");
      router.refresh();

      if (mode === "preview") {
        router.push(`/proposals/${data.proposal.id}/preview`);
      } else {
        router.push(`/proposals`);
      }
    } catch {
      showToast("Something went wrong", "error");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-6 pb-24">
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Client &amp; Event Details</h2>
        </CardHeader>
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ClientAutocomplete value={form.clientName} onChange={(v) => update("clientName", v)} onSelectClient={handleSelectClient} error={errors.clientName} />
          <Input label="Company" value={form.company} onChange={(e) => update("company", e.target.value)} />
          <Input label="Contact Person" value={form.contactPerson} onChange={(e) => update("contactPerson", e.target.value)} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
          <Input label="Phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          <Input label="Sales Person" value={form.salesPersonName} onChange={(e) => update("salesPersonName", e.target.value)} />

          <Input label="Event Name" required value={form.eventName} onChange={(e) => update("eventName", e.target.value)} error={errors.eventName} />
          <Input label="Event Date" type="date" value={form.eventDate} onChange={(e) => update("eventDate", e.target.value)} />
          <Input label="Venue" value={form.venue} onChange={(e) => update("venue", e.target.value)} />
          <Input label="Proposal Date" type="date" value={form.proposalDate} onChange={(e) => update("proposalDate", e.target.value)} />

          <div className="sm:col-span-2 lg:col-span-3">
            <Textarea label="Notes" rows={3} value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Any special requirements or internal notes..." />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Materials</h2>
        </CardHeader>
        <CardBody className="space-y-6">
          <ProposalItemsTable
            items={items}
            onChange={handleItemChange}
            onRemove={handleRemoveItem}
            onAddItem={() => setPickerOpen(true)}
            onAddCustomItem={handleAddCustomItem}
          />
          <ProposalSummary
            subtotal={totals.subtotal}
            discountPercent={discountPercent}
            discountAmount={totals.discountAmount}
            taxPercent={taxPercent}
            taxAmount={totals.taxAmount}
            roundOff={totals.roundOff}
            grandTotal={totals.grandTotal}
            onDiscountPercentChange={setDiscountPercent}
            onTaxPercentChange={setTaxPercent}
            onRoundOffChange={setRoundOff}
          />
        </CardBody>
      </Card>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur no-print dark:border-slate-800 dark:bg-slate-900/95 lg:left-64">
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button variant="outline" onClick={() => router.push("/proposals")}>
            Cancel
          </Button>
          <Button variant="secondary" loading={saving === "draft"} onClick={() => handleSave("draft")}>
            Save Draft
          </Button>
          <Button loading={saving === "preview"} onClick={() => handleSave("preview")}>
            Save &amp; Preview
          </Button>
        </div>
      </div>

      <MaterialPickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={handleSelectMaterial} />
    </div>
  );
}
