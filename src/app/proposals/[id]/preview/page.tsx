import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCompanySettings } from "@/lib/companySettings";
import { ProposalPreviewDocument } from "@/components/proposals/ProposalPreviewDocument";
import { ProposalPreviewActions } from "@/components/proposals/ProposalPreviewActions";
import type { CompanySettings, Proposal } from "@/types";

export default async function ProposalPreviewPage({ params }: { params: { id: string } }) {
  const [proposal, settings] = await Promise.all([
    prisma.proposal.findUnique({
      where: { id: params.id },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    }),
    getCompanySettings(),
  ]);

  if (!proposal) notFound();

  const serializedProposal: Proposal = JSON.parse(JSON.stringify(proposal));
  const serializedSettings: CompanySettings = JSON.parse(JSON.stringify(settings));

  return (
    <div>
      <ProposalPreviewActions proposal={serializedProposal} />
      <ProposalPreviewDocument proposal={serializedProposal} settings={serializedSettings} />
    </div>
  );
}
