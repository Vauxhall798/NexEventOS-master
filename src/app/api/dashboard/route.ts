import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withApiErrorHandling } from "@/lib/apiError";
import type { ProposalStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

// "Won" value only counts proposals that actually closed — summing DRAFT/SENT/
// REJECTED/CANCELLED alongside APPROVED/COMPLETED would inflate this into a
// pipeline total while the stat card is labeled "Total Value" (i.e. revenue).
const WON_STATUSES: ProposalStatus[] = ["APPROVED", "COMPLETED"];

export const GET = withApiErrorHandling(async () => {
  const [totalProposals, drafts, approved, rejected, valueAgg, recentProposals] = await Promise.all([
    prisma.proposal.count(),
    prisma.proposal.count({ where: { status: "DRAFT" } }),
    prisma.proposal.count({ where: { status: "APPROVED" } }),
    prisma.proposal.count({ where: { status: "REJECTED" } }),
    prisma.proposal.aggregate({ _sum: { grandTotal: true }, where: { status: { in: WON_STATUSES } } }),
    prisma.proposal.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({
    totalProposals,
    drafts,
    approved,
    rejected,
    totalProposalValue: Number(valueAgg._sum.grandTotal ?? 0),
    recentProposals,
  });
});
