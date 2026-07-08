"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";
import { PROPOSAL_STATUSES, PROPOSAL_STATUS_LABELS, PROPOSAL_STATUS_STYLES } from "@/lib/proposalStatus";
import type { ProposalStatus } from "@/types";

export function ProposalStatusSelect({ id, status, onChanged }: { id: string; status: ProposalStatus; onChanged: (status: ProposalStatus) => void }) {
  const [updating, setUpdating] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  async function handleChange(next: ProposalStatus) {
    setUpdating(true);
    try {
      const res = await fetch(`/api/proposals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        showToast("Failed to update status", "error");
        return;
      }
      onChanged(next);
      showToast("Status updated");
      router.refresh();
    } finally {
      setUpdating(false);
    }
  }

  return (
    <select
      value={status}
      disabled={updating}
      onChange={(e) => handleChange(e.target.value as ProposalStatus)}
      className={`cursor-pointer rounded-full border-none px-2.5 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:opacity-60 ${PROPOSAL_STATUS_STYLES[status]}`}
    >
      {PROPOSAL_STATUSES.map((s) => (
        <option key={s} value={s} className="bg-white text-slate-800 dark:bg-slate-800 dark:text-slate-100">
          {PROPOSAL_STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  );
}
