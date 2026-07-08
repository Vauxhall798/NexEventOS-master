"use client";

import { FormEvent, useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ToastProvider";
import type { Category, Material } from "@/types";

interface MaterialFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  categories: Category[];
  material?: Material | null;
}

const emptyForm = {
  materialCode: "",
  materialName: "",
  categoryName: "",
  subCategory: "",
  unit: "",
  costPrice: "",
  sellingPrice: "",
  description: "",
};

export function MaterialFormModal({ open, onClose, onSaved, categories, material }: MaterialFormModalProps) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (open) {
      setForm(
        material
          ? {
              materialCode: material.materialCode,
              materialName: material.materialName,
              categoryName: material.category?.name ?? "",
              subCategory: material.subCategory ?? "",
              unit: material.unit,
              costPrice: String(material.costPrice),
              sellingPrice: String(material.sellingPrice),
              description: material.description ?? "",
            }
          : emptyForm
      );
      setErrors({});
    }
  }, [open, material]);

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!form.materialCode.trim()) next.materialCode = "Material code is required";
    if (form.materialCode.trim().length > 50) next.materialCode = "Must be under 50 characters";
    if (!form.materialName.trim()) next.materialName = "Material name is required";
    if (!form.unit.trim()) next.unit = "Unit is required";
    if (form.sellingPrice) {
      const val = Number(form.sellingPrice);
      if (Number.isNaN(val)) next.sellingPrice = "Must be a number";
      else if (val < 0) next.sellingPrice = "Cannot be negative";
    }
    if (form.costPrice) {
      const val = Number(form.costPrice);
      if (Number.isNaN(val)) next.costPrice = "Must be a number";
      else if (val < 0) next.costPrice = "Cannot be negative";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const res = await fetch(material ? `/api/materials/${material.id}` : "/api/materials", {
        method: material ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to save material", "error");
        return;
      }
      showToast(material ? "Material updated" : "Material added");
      onSaved();
      onClose();
    } catch {
      showToast("Something went wrong", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={material ? "Edit Material" : "Add New Material"} size="lg">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Material Code" required maxLength={50} value={form.materialCode} onChange={(e) => update("materialCode", e.target.value)} error={errors.materialCode} placeholder="LED001" />
        <Input label="Material Name" required maxLength={200} value={form.materialName} onChange={(e) => update("materialName", e.target.value)} error={errors.materialName} placeholder="P3 Indoor LED Wall" />

        <div>
          <Input
            label="Category"
            value={form.categoryName}
            onChange={(e) => update("categoryName", e.target.value)}
            placeholder="LED Screen"
            list="category-options"
          />
          <datalist id="category-options">
            {categories.map((c) => (
              <option key={c.id} value={c.name} />
            ))}
          </datalist>
        </div>
        <Input label="Sub Category" value={form.subCategory} onChange={(e) => update("subCategory", e.target.value)} placeholder="Indoor" />

        <Input label="Unit" required value={form.unit} onChange={(e) => update("unit", e.target.value)} error={errors.unit} placeholder="Sq.ft" />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Cost Price" type="number" step="0.01" min="0" value={form.costPrice} onChange={(e) => update("costPrice", e.target.value)} error={errors.costPrice} />
          <Input label="Selling Price" type="number" step="0.01" min="0" value={form.sellingPrice} onChange={(e) => update("sellingPrice", e.target.value)} error={errors.sellingPrice} />
        </div>

        <div className="sm:col-span-2">
          <Textarea label="Description" rows={3} value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="High resolution LED panel" />
        </div>

        <div className="sm:col-span-2 mt-2 flex justify-end gap-3">
          <Button type="button" variant="outline" disabled={saving} onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {material ? "Save Changes" : "Add Material"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
