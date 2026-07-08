"use client";

import { FormEvent, useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ToastProvider";
import type { Client } from "@/types";

interface ClientFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  client: Client | null;
}

const emptyForm = { clientName: "", company: "", contactPerson: "", email: "", phone: "" };

export function ClientFormModal({ open, onClose, onSaved, client }: ClientFormModalProps) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (open) {
      setForm(
        client
          ? {
              clientName: client.clientName,
              company: client.company ?? "",
              contactPerson: client.contactPerson ?? "",
              email: client.email ?? "",
              phone: client.phone ?? "",
            }
          : emptyForm
      );
      setErrors({});
    }
  }, [open, client]);

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+\d][\d\s-]{6,19}$/;

function validate(form: typeof emptyForm): Record<string, string> {
  const next: Record<string, string> = {};
  if (!form.clientName.trim()) next.clientName = "Client name is required";
  else if (form.clientName.trim().length > 200) next.clientName = "Must be under 200 characters";
  if (form.email.trim() && !EMAIL_PATTERN.test(form.email.trim())) next.email = "Enter a valid email address";
  if (form.phone.trim() && !PHONE_PATTERN.test(form.phone.trim())) next.phone = "Enter a valid phone number";
  return next;
}

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (!client || Object.keys(validationErrors).length > 0) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to save client", "error");
        return;
      }
      showToast("Client updated");
      onSaved();
      onClose();
    } catch {
      showToast("Something went wrong", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Client" size="md">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Input label="Client Name" required maxLength={200} value={form.clientName} onChange={(e) => update("clientName", e.target.value)} error={errors.clientName} />
        </div>
        <Input label="Company" maxLength={200} value={form.company} onChange={(e) => update("company", e.target.value)} />
        <Input label="Contact Person" maxLength={200} value={form.contactPerson} onChange={(e) => update("contactPerson", e.target.value)} />
        <Input label="Email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} error={errors.email} />
        <Input label="Phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} error={errors.phone} />

        <div className="sm:col-span-2 mt-2 flex justify-end gap-3">
          <Button type="button" variant="outline" disabled={saving} onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
