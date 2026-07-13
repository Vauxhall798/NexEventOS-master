import { ProposalEditor } from "@/components/proposals/ProposalEditor";
import { getCompanySettings } from "@/lib/companySettings";

export const dynamic = "force-dynamic";

export default async function NewProposalPage() {
  const settings = await getCompanySettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">New Proposal</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Fill in client and event details, then add materials from your master list.</p>
      </div>
      <ProposalEditor defaultTaxPercent={settings.defaultTaxPercent} settings={JSON.parse(JSON.stringify(settings))} />
    </div>
  );
}
