"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { MaterialPickerModal } from "./MaterialPickerModal";
import { ClientAutocomplete } from "./ClientAutocomplete";
import { ProposalItemsTable } from "./ProposalItemsTable";
import { ProposalSummary } from "./ProposalSummary";
import { ProposalPreviewActions } from "./ProposalPreviewActions";
import { ProposalPreviewDocument } from "./ProposalPreviewDocument";
import { computeTotals } from "@/lib/calculations";
import { useToast } from "@/components/ToastProvider";
import type { Client, Material, Proposal, ProposalItem, CompanySettings } from "@/types";

interface ProposalEditorProps {
  proposal?: Proposal;
  /** Company's configured default tax rate — seeds a new proposal's tax %. Ignored when editing. */
  defaultTaxPercent?: number;
  settings?: CompanySettings;
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

export function ProposalEditor({ proposal, defaultTaxPercent, settings }: ProposalEditorProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const { data: session } = useSession();
  const isAuthenticated = !!session;
  const isEditing = !!proposal;

  // Force light theme for public (unauthenticated) proposal submissions so PDF preview matches printed output
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isAuthenticated) {
      try {
        // dynamic import of the hook to avoid SSR issues
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { useTheme } = require("@/components/ThemeProvider");
        // @ts-ignore
        const ctx = useTheme();
        if (ctx?.setTheme) ctx.setTheme("light");
      } catch (e) {
        // ignore
      }
    }
  }, [isAuthenticated]);

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedProposalNumber, setSubmittedProposalNumber] = useState("");
  const [submittedProposal, setSubmittedProposal] = useState<Proposal | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // When a client submits a proposal, generate a PDF from the rendered preview
  useEffect(() => {
    let mounted = true;
    let url: string | null = null;

    async function generatePdf() {
      if (!submittedProposal) return;
      setGeneratingPdf(true);
      try {
        const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([import("jspdf"), import("html2canvas")]);
        // Wait a tick for the DOM to render the preview
        await new Promise((r) => setTimeout(r, 100));
        const node = document.getElementById("print-area");
        if (!node) return;

        const scale = 2;
        const canvas = await html2canvas(node, { scale, useCORS: true, backgroundColor: "#ffffff" });
        const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
        // replicate addPaginatedImage logic
        const imgData = canvas.toDataURL("image/png");
        const pageHeight = 841.89; // A4 pt height
        const imgProps = pdf.getImageProperties(imgData);
        const imgHeight = (imgProps.height * pdf.internal.pageSize.getWidth()) / imgProps.width;
        let position = 0;
        pdf.addImage(imgData, "PNG", 0, position, pdf.internal.pageSize.getWidth(), imgHeight);
        // If content taller than one page, add pages
        while (imgHeight - position > pageHeight) {
          position -= pageHeight;
          pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, position, pdf.internal.pageSize.getWidth(), imgHeight);
        }

        const blob = pdf.output("blob");
        url = URL.createObjectURL(blob);
        if (mounted) setPdfUrl(url);
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setGeneratingPdf(false);
      }
    }

    generatePdf();

    return () => {
      mounted = false;
      if (url) URL.revokeObjectURL(url);
      setPdfUrl(null);
      setGeneratingPdf(false);
    };
    // only run when submittedProposal changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submittedProposal]);

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

      if (!isAuthenticated) {
        setSubmittedProposalNumber(data.proposal.proposalNumber);
        setSubmittedProposal(data.proposal);
        setIsSubmitted(true);
        return;
      }

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

  if (isSubmitted) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center max-w-xl mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-8 mt-6 animate-fade-in">
          <div className="rounded-full bg-emerald-100 p-4 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 mb-4">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Proposal Sent!</h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-md mb-4 text-sm">
            Thank you — we've saved your proposal and notified the admin team for review.
          </p>
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl px-6 py-3 mb-4 w-full border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-xs text-slate-400 dark:text-slate-500 block font-semibold uppercase tracking-wider mb-1">Proposal Reference</span>
            <span className="text-xl font-bold text-slate-800 dark:text-slate-200 font-mono">{submittedProposalNumber}</span>
          </div>
          <div className="w-full max-w-xl">
            <Button variant="outline" onClick={() => window.location.reload()} className="w-full">
              Submit Another Proposal
            </Button>
          </div>
        </div>

        {submittedProposal && (
          <div className="max-w-4xl mx-auto">
            <ProposalPreviewActions proposal={submittedProposal} />
            <ProposalPreviewDocument proposal={submittedProposal} settings={settings ?? ({} as CompanySettings)} />
            <div className="mt-6">
              {generatingPdf && (
                <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">Generating PDF preview…</div>
              )}
              {pdfUrl && (
                <div className="mt-3 rounded-lg border overflow-hidden">
                  <iframe src={pdfUrl} title="Proposal PDF" className="w-full h-[800px]" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Client &amp; Event Details</h2>
        </CardHeader>
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {!isAuthenticated ? (
            <Input
              label="Client Name"
              required
              value={form.clientName}
              onChange={(e) => update("clientName", e.target.value)}
              error={errors.clientName}
              placeholder="Your Name"
            />
          ) : (
            <ClientAutocomplete value={form.clientName} onChange={(v) => update("clientName", v)} onSelectClient={handleSelectClient} error={errors.clientName} />
          )}
          <Input label="Company" value={form.company} onChange={(e) => update("company", e.target.value)} placeholder="Company Name (optional)" />
          <Input label="Contact Person" value={form.contactPerson} onChange={(e) => update("contactPerson", e.target.value)} placeholder="Contact Person (optional)" />
          <Input label="Email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="email@example.com (optional)" />
          <Input label="Phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="Phone Number (optional)" />
          {isAuthenticated && (
            <Input label="Sales Person" value={form.salesPersonName} onChange={(e) => update("salesPersonName", e.target.value)} />
          )}

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

      <div className={`fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur no-print dark:border-slate-800 dark:bg-slate-900/95 ${isAuthenticated ? "lg:left-64" : ""}`}>
        <div className={`flex flex-wrap items-center gap-3 ${isAuthenticated ? "justify-end" : "justify-center max-w-5xl mx-auto w-full"}`}>
          {isAuthenticated ? (
            <>
              <Button variant="outline" onClick={() => router.push("/proposals")}>
                Cancel
              </Button>
              <Button variant="secondary" loading={saving === "draft"} onClick={() => handleSave("draft")}>
                Save Draft
              </Button>
              <Button loading={saving === "preview"} onClick={() => handleSave("preview")}>
                Save &amp; Preview
              </Button>
            </>
          ) : (
            <Button variant="primary" size="lg" loading={saving === "draft"} onClick={() => handleSave("draft")} className="px-8 py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg shadow-md transition duration-200">
              Send to Admin
            </Button>
          )}
        </div>
      </div>

      <MaterialPickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={handleSelectMaterial} />
    </div>
  );
}
