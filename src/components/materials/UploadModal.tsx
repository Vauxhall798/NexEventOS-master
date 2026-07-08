"use client";

import { useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ToastProvider";

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  onUploaded: () => void;
}

interface UploadResult {
  created: number;
  updated: number;
  skipped: number;
  total: number;
  errors: string[];
}

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".xlsx", ".csv"];

function validateFile(file: File): string | null {
  const hasAllowedExtension = ALLOWED_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext));
  if (!hasAllowedExtension) return "Only .xlsx or .csv files are allowed";
  if (file.size > MAX_SIZE_BYTES) return "File must be smaller than 5MB";
  return null;
}

export function UploadModal({ open, onClose, onUploaded }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  function reset() {
    setFile(null);
    setResult(null);
    setDragOver(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function trySetFile(candidate: File) {
    const error = validateFile(candidate);
    if (error) {
      showToast(error, "error");
      return;
    }
    setFile(candidate);
  }

  async function handleUpload() {
    if (!file) return;
    const error = validateFile(file);
    if (error) {
      showToast(error, "error");
      return;
    }
    setUploading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/materials/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Upload failed", "error");
        return;
      }
      setResult(data);
      showToast(`Imported ${data.created + data.updated} materials`);
      onUploaded();
    } catch {
      showToast("Something went wrong during upload", "error");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Upload Material List" size="md">
      <div className="space-y-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Upload an <span className="font-medium">.xlsx</span> or <span className="font-medium">.csv</span> file with columns: Material Code, Material Name, Category, Sub
          Category, Unit, Cost Price, Selling Price, Description.
        </p>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const dropped = e.dataTransfer.files?.[0];
            if (dropped) trySetFile(dropped);
          }}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
            dragOver ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20" : "border-slate-300 dark:border-slate-700"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => {
              const selected = e.target.files?.[0];
              if (selected) trySetFile(selected);
            }}
          />
          <svg className="mx-auto h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M12 12v9m0-9l3 3m-3-3l-3 3" />
          </svg>
          {file ? (
            <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-200">{file.name}</p>
          ) : (
            <>
              <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">Click to browse or drag & drop</p>
              <p className="text-xs text-slate-400">.xlsx or .csv up to 5MB</p>
            </>
          )}
        </div>

        {result && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-slate-800">
            <p className="font-medium text-slate-700 dark:text-slate-200">
              {result.created} created &middot; {result.updated} updated &middot; {result.skipped} skipped (of {result.total} rows)
            </p>
            {result.errors.length > 0 && (
              <ul className="mt-2 max-h-24 list-disc space-y-0.5 overflow-y-auto pl-5 text-xs text-red-500">
                {result.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
          <Button onClick={handleUpload} disabled={!file} loading={uploading}>
            Upload &amp; Import
          </Button>
        </div>
      </div>
    </Modal>
  );
}
