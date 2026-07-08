import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProposalEditor } from "@/components/proposals/ProposalEditor";
import type { Proposal } from "@/types";

export default async function EditProposalPage({ params }: { params: { id: string } }) {
  const proposal = await prisma.proposal.findUnique({
    where: { id: params.id },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });

  if (!proposal) notFound();

  const serialized: Proposal = JSON.parse(JSON.stringify(proposal));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Edit Proposal — {proposal.proposalNumber}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Update client, event, or material details below.</p>
      </div>
      <ProposalEditor proposal={serialized} />
    </div>
  );
}
