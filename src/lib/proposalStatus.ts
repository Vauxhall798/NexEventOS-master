import { ProposalStatus } from "@prisma/client";

// The Postgres enum in schema.prisma is now the single source of truth for
// the status set itself; this derives the array from it (via Object.values)
// so it can never drift out of sync. Labels/styles/the type guard stay here
// since Prisma has no equivalent for UI metadata.
export const PROPOSAL_STATUSES: ProposalStatus[] = Object.values(ProposalStatus);

export const PROPOSAL_STATUS_LABELS: Record<ProposalStatus, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  VIEWED: "Viewed",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const PROPOSAL_STATUS_STYLES: Record<ProposalStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  SENT: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  VIEWED: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  APPROVED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  COMPLETED: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  CANCELLED: "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

export function isProposalStatus(value: unknown): value is ProposalStatus {
  return typeof value === "string" && (PROPOSAL_STATUSES as string[]).includes(value);
}
