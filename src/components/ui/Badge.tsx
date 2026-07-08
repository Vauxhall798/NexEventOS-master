import clsx from "clsx";
import { PROPOSAL_STATUS_LABELS, PROPOSAL_STATUS_STYLES, isProposalStatus } from "@/lib/proposalStatus";

export function StatusBadge({ status }: { status: string }) {
  const style = isProposalStatus(status) ? PROPOSAL_STATUS_STYLES[status] : PROPOSAL_STATUS_STYLES.DRAFT;
  const label = isProposalStatus(status) ? PROPOSAL_STATUS_LABELS[status] : status;

  return (
    <span className={clsx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", style)}>{label}</span>
  );
}

export function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={clsx("inline-flex items-center rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300", className)}>
      {children}
    </span>
  );
}
