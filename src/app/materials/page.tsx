"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { PageLoader } from "@/components/ui/Spinner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { MaterialTable } from "@/components/materials/MaterialTable";
import { MaterialFormModal } from "@/components/materials/MaterialFormModal";
import { UploadModal } from "@/components/materials/UploadModal";
import { useToast } from "@/components/ToastProvider";
import type { Category, Material } from "@/types";

export default function MaterialMasterPage() {
  const router = useRouter();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editing, setEditing] = useState<Material | null>(null);
  const [deleting, setDeleting] = useState<Material | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { showToast } = useToast();

  async function loadCategories() {
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(data.categories ?? []);
  }

  async function loadMaterials() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      const res = await fetch(`/api/materials?${params.toString()}`);
      const data = await res.json();
      setMaterials(data.materials ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => loadMaterials(), 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, categoryFilter]);

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/materials/${deleting.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        showToast(data.error || "Failed to delete material", "error");
        return;
      }
      showToast("Material deleted");
      router.refresh();
      setDeleting(null);
      loadMaterials();
    } finally {
      setDeleteLoading(false);
    }
  }

  const summary = useMemo(
    () => ({
      total: materials.length,
      categories: new Set(materials.map((m) => m.category?.name).filter(Boolean)).size,
    }),
    [materials]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Material Master</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {summary.total} materials across {summary.categories} categories
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setUploadOpen(true)}>
            <UploadIcon className="h-4 w-4" /> Upload File
          </Button>
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <PlusIcon className="h-4 w-4" /> Add New Material
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <Input placeholder="Search by code, name, or description..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="sm:w-56">
            <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
        </CardHeader>
        <CardBody>{loading ? <PageLoader /> : <MaterialTable materials={materials} onEdit={(m) => { setEditing(m); setFormOpen(true); }} onDelete={setDeleting} />}</CardBody>
      </Card>

      <MaterialFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          loadMaterials();
          loadCategories();
          router.refresh();
        }}
        categories={categories}
        material={editing}
      />

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={() => {
          loadMaterials();
          loadCategories();
          router.refresh();
        }}
      />

      <ConfirmDialog
        open={!!deleting}
        title="Delete Material"
        message={`Are you sure you want to delete "${deleting?.materialName}"? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function UploadIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12" />
    </svg>
  );
}
