import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentProposalsTable } from "@/components/dashboard/RecentProposalsTable";
import { formatCurrency } from "@/lib/calculations";
import type { Proposal, ProposalStatus } from "@/types";

export const dynamic = "force-dynamic";

// "Won" value only counts proposals that actually closed — summing DRAFT/SENT/
// REJECTED/CANCELLED alongside APPROVED/COMPLETED would inflate this into a
// pipeline total while the stat card is labeled "Total Value" (i.e. revenue).
const WON_STATUSES: ProposalStatus[] = ["APPROVED", "COMPLETED"];

export default async function DashboardPage() {
  const [totalProposals, drafts, approved, rejected, valueAgg, recentProposals, materialCount] = await Promise.all([
    prisma.proposal.count(),
    prisma.proposal.count({ where: { status: "DRAFT" } }),
    prisma.proposal.count({ where: { status: "APPROVED" } }),
    prisma.proposal.count({ where: { status: "REJECTED" } }),
    prisma.proposal.aggregate({ _sum: { grandTotal: true }, where: { status: { in: WON_STATUSES } } }),
    prisma.proposal.findMany({ take: 6, orderBy: { createdAt: "desc" } }),
    prisma.material.count({ where: { isActive: true } }),
  ]);

  const serializedRecent: Proposal[] = JSON.parse(JSON.stringify(recentProposals));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Overview of your proposals and material catalogue.</p>
        </div>
        <Link href="/proposals/new">
          <Button>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Proposal
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="Total Proposals" value={String(totalProposals)} accent="brand" icon={<DocIcon className="h-6 w-6" />} />
        <StatCard label="Drafts" value={String(drafts)} accent="slate" icon={<PencilIcon className="h-6 w-6" />} />
        <StatCard label="Approved" value={String(approved)} accent="emerald" icon={<CheckIcon className="h-6 w-6" />} />
        <StatCard label="Rejected" value={String(rejected)} accent="red" icon={<XIcon className="h-6 w-6" />} />
        <StatCard label="Total Value" value={formatCurrency(Number(valueAgg._sum.grandTotal ?? 0))} accent="amber" icon={<CoinIcon className="h-6 w-6" />} />
        <StatCard label="Materials" value={String(materialCount)} accent="brand" icon={<BoxIcon className="h-6 w-6" />} />
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Recent Proposals</h2>
          <Link href="/proposals" className="text-sm font-medium text-brand-600 hover:underline">
            View all
          </Link>
        </CardHeader>
        <CardBody>
          <RecentProposalsTable proposals={serializedRecent} />
        </CardBody>
      </Card>
    </div>
  );
}

function DocIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
function PencilIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}
function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 13l4 4L19 7" />
    </svg>
  );
}
function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
function CoinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8c-1.657 0-3 .672-3 1.5S10.343 11 12 11s3 .672 3 1.5-1.343 1.5-3 1.5m0-6c1.11 0 2.08.402 2.599 1M12 8V7m0 1v6m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function BoxIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}
