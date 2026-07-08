import { PROPOSAL_STATUSES, PROPOSAL_STATUS_LABELS, PROPOSAL_STATUS_STYLES } from "@/lib/proposalStatus";
import type { ProposalStatus } from "@/types";
import clsx from "clsx";

export function ClientStatusDistribution({ distribution }: { distribution: Record<ProposalStatus, number> }) {
  const total = PROPOSAL_STATUSES.reduce((sum, s) => sum + (distribution[s] ?? 0), 0);

  if (total === 0) {
    return <p className="text-sm text-slate-400">No proposals yet.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {PROPOSAL_STATUSES.filter((s) => (distribution[s] ?? 0) > 0).map((s) => (
        <span key={s} className={clsx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", PROPOSAL_STATUS_STYLES[s])}>
          {PROPOSAL_STATUS_LABELS[s]}
          <span className="font-semibold">{distribution[s]}</span>
        </span>
      ))}
    </div>
  );
}
