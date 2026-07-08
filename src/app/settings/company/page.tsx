"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/Spinner";
import { ImageUploadField } from "@/components/settings/ImageUploadField";
import { useToast } from "@/components/ToastProvider";
import { APP_INFO } from "@/lib/appInfo";
import type { CompanySettings } from "@/types";

type FormState = Omit<CompanySettings, "id" | "updatedAt">;

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED"];

const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/;

function toForm(settings: CompanySettings): FormState {
  const { id: _id, updatedAt: _updatedAt, ...rest } = settings;
  return rest;
}

export default function CompanySettingsPage() {
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetch("/api/settings/company")
      .then((res) => res.json())
      .then((data) => setForm(toForm(data.settings)))
      .finally(() => setLoading(false));
  }, []);

  function update<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  async function handleSave() {
    if (!form) return;
    if (!form.companyName.trim()) {
      showToast("Company name is required", "error");
      return;
    }
    if (form.gstNumber?.trim() && !GSTIN_PATTERN.test(form.gstNumber.trim().toUpperCase())) {
      showToast("GST number doesn't look like a valid 15-character GSTIN", "error");
      return;
    }
    if (form.panNumber?.trim() && !PAN_PATTERN.test(form.panNumber.trim().toUpperCase())) {
      showToast("PAN number doesn't look like a valid 10-character PAN", "error");
      return;
    }
    if (form.bankIfscCode?.trim() && !IFSC_PATTERN.test(form.bankIfscCode.trim().toUpperCase())) {
      showToast("IFSC code doesn't look like a valid 11-character IFSC", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/settings/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to save settings", "error");
        return;
      }
      setForm(toForm(data.settings));
      showToast("Company settings saved");
    } catch {
      showToast("Something went wrong", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !form) return <PageLoader />;

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Company Profile</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          This information automatically appears on every proposal — header, footer, bank details, and signature.
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Company Details</h2>
        </CardHeader>
        <CardBody className="space-y-5">
          <ImageUploadField label="Company Logo" value={form.logoUrl} onChange={(url) => update("logoUrl", url)} hint="PNG, JPEG, or WEBP · up to 5MB" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input label="Company Name" required value={form.companyName} onChange={(e) => update("companyName", e.target.value)} />
            <Input label="GST Number" value={form.gstNumber ?? ""} onChange={(e) => update("gstNumber", e.target.value)} />
            <Input label="PAN Number" value={form.panNumber ?? ""} onChange={(e) => update("panNumber", e.target.value)} />
            <Input label="Phone" value={form.phone ?? ""} onChange={(e) => update("phone", e.target.value)} />
            <Input label="Email" type="email" value={form.email ?? ""} onChange={(e) => update("email", e.target.value)} />
            <Input label="Website" value={form.website ?? ""} onChange={(e) => update("website", e.target.value)} />
          </div>
          <Textarea label="Address" rows={2} value={form.address ?? ""} onChange={(e) => update("address", e.target.value)} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Bank Details</h2>
        </CardHeader>
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Input label="Bank Name" value={form.bankName ?? ""} onChange={(e) => update("bankName", e.target.value)} />
          <Input label="Account Name" value={form.bankAccountName ?? ""} onChange={(e) => update("bankAccountName", e.target.value)} />
          <Input label="Account Number" value={form.bankAccountNumber ?? ""} onChange={(e) => update("bankAccountNumber", e.target.value)} />
          <Input label="IFSC Code" value={form.bankIfscCode ?? ""} onChange={(e) => update("bankIfscCode", e.target.value)} />
          <Input label="Branch" value={form.bankBranch ?? ""} onChange={(e) => update("bankBranch", e.target.value)} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Authorized Signatory</h2>
        </CardHeader>
        <CardBody className="space-y-5">
          <Input label="Signatory Name" value={form.authorizedSignatory ?? ""} onChange={(e) => update("authorizedSignatory", e.target.value)} />
          <ImageUploadField label="Digital Signature" value={form.signatureUrl} onChange={(url) => update("signatureUrl", url)} hint="Transparent PNG works best" />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Proposal Defaults</h2>
        </CardHeader>
        <CardBody className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Input
                label="Proposal Prefix"
                value={form.proposalPrefix}
                maxLength={10}
                onChange={(e) => update("proposalPrefix", e.target.value.toUpperCase())}
                placeholder="EVT"
              />
              <p className="mt-1 text-xs text-slate-400">
                Example format: <span className="font-mono">{(form.proposalPrefix || "PROP").replace(/[^A-Z0-9]/gi, "").toUpperCase() || "PROP"}-{new Date().getFullYear()}-0001</span>
              </p>
            </div>
            <Input
              label="Default Tax %"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={form.defaultTaxPercent}
              onChange={(e) => update("defaultTaxPercent", parseFloat(e.target.value) || 0)}
            />
            <Select label="Currency" value={form.currency} onChange={(e) => update("currency", e.target.value)}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
          <Textarea label="Footer Text" rows={2} value={form.footerText ?? ""} onChange={(e) => update("footerText", e.target.value)} placeholder="Shown at the bottom of every proposal PDF" />
          <Textarea
            label="Terms & Conditions"
            rows={5}
            value={form.termsAndConditions ?? ""}
            onChange={(e) => update("termsAndConditions", e.target.value)}
            placeholder="Default terms applied to new proposals"
          />
        </CardBody>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">
          {APP_INFO.productName} {APP_INFO.version}
        </p>
        <Button onClick={handleSave} loading={saving}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}
