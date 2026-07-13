import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCompanySettings } from "@/lib/companySettings";
import { ProposalPreviewDocument } from "@/components/proposals/ProposalPreviewDocument";
import { ProposalPreviewActions } from "@/components/proposals/ProposalPreviewActions";
import type { CompanySettings, Proposal } from "@/types";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function ProposalPreviewPage({ params }: { params: { id: string } }) {
  const [proposal, settings] = await Promise.all([
    prisma.proposal.findUnique({
      where: { id: params.id },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    }),
    getCompanySettings(),
  ]);

  if (!proposal) notFound();

  // If an admin/manager is viewing, mark as reviewed
  try {
    const sess: any = await getServerSession(authOptions as any);
    if (sess && ["ADMIN", "MANAGER"].includes(sess.user?.role) && !proposal.isReviewed) {
      await prisma.proposal.update({ where: { id: params.id }, data: { isReviewed: true } });
      proposal.isReviewed = true;
    }
  } catch (e) {
    // ignore
  }

  const serializedProposal: Proposal = JSON.parse(JSON.stringify(proposal));
  const serializedSettings: CompanySettings = JSON.parse(JSON.stringify(settings));

  return (
    <div>
      <ProposalPreviewActions proposal={serializedProposal} />
      <ProposalPreviewDocument proposal={serializedProposal} settings={serializedSettings} />
      {/* Notify other tabs/components that this proposal has been reviewed */}
      {/* Client component posts a BroadcastChannel message */}
      {/* @ts-ignore server -> client component import */}
      {
        // Dynamically import the client notifier so this server file stays valid
      }
      <script dangerouslySetInnerHTML={{ __html: `(() => { try { const c = new BroadcastChannel('nexeventos-proposals'); c.postMessage({type:'reviewed', id: '${params.id}'}); c.close(); } catch(e) { try { localStorage.setItem('nexeventos:proposal-reviewed', JSON.stringify({id:'${params.id}', t:Date.now()})); } catch(_){} } })()` }} />
    </div>
  );
}
