import { formatCurrency, formatDate } from "@/lib/calculations";
import { APP_INFO } from "@/lib/appInfo";
import type { CompanySettings, Proposal } from "@/types";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function ProposalPreviewDocument({ proposal, settings }: { proposal: Proposal; settings: CompanySettings }) {
  const currency = settings.currency || "INR";
  const hasBankDetails = settings.bankName || settings.bankAccountNumber || settings.bankIfscCode;

  return (
    <div id="print-area" className="mx-auto max-w-4xl rounded-2xl bg-white p-8 text-slate-800 shadow-card print:rounded-none print:shadow-none sm:p-12">
      <div data-pdf-block className="flex flex-col justify-between gap-6 border-b border-slate-200 pb-6 sm:flex-row sm:items-start">
        <div className="flex items-center gap-4">
          {settings.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.logoUrl} alt={settings.companyName} className="h-16 w-16 shrink-0 rounded-2xl object-contain" />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-2xl font-bold text-white">
              {initials(settings.companyName)}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-slate-900">{settings.companyName}</h1>
            {settings.address && <p className="mt-1 text-xs text-slate-400">{settings.address}</p>}
            <p className="text-xs text-slate-400">{[settings.phone, settings.email].filter(Boolean).join(" · ")}</p>
            {(settings.gstNumber || settings.panNumber) && (
              <p className="text-xs text-slate-400">
                {settings.gstNumber && `GSTIN: ${settings.gstNumber}`}
                {settings.gstNumber && settings.panNumber && " · "}
                {settings.panNumber && `PAN: ${settings.panNumber}`}
              </p>
            )}
          </div>
        </div>
        <div className="text-left sm:text-right">
          <h2 className="text-lg font-bold uppercase tracking-wide text-brand-600">Proposal</h2>
          <p className="text-sm font-medium text-slate-700">{proposal.proposalNumber}</p>
          <p className="text-xs text-slate-400">Date: {formatDate(proposal.proposalDate)}</p>
        </div>
      </div>

      <div data-pdf-block className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Client Details</h3>
          <p className="mt-2 font-semibold text-slate-800">{proposal.clientName}</p>
          {proposal.company && <p className="text-sm text-slate-600">{proposal.company}</p>}
          {proposal.contactPerson && <p className="text-sm text-slate-600">Attn: {proposal.contactPerson}</p>}
          {proposal.email && <p className="text-sm text-slate-600">{proposal.email}</p>}
          {proposal.phone && <p className="text-sm text-slate-600">{proposal.phone}</p>}
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Event Details</h3>
          <p className="mt-2 font-semibold text-slate-800">{proposal.eventName}</p>
          <p className="text-sm text-slate-600">Date: {formatDate(proposal.eventDate)}</p>
          {proposal.venue && <p className="text-sm text-slate-600">Venue: {proposal.venue}</p>}
          {proposal.salesPersonName && <p className="text-sm text-slate-600">Sales Person: {proposal.salesPersonName}</p>}
        </div>
      </div>

      <div className="mt-8">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b-2 border-slate-800 text-xs uppercase tracking-wider text-slate-500">
              <th className="py-2 pr-2 font-semibold">#</th>
              <th className="py-2 pr-2 font-semibold">Description</th>
              <th className="py-2 pr-2 text-right font-semibold">Qty</th>
              <th className="py-2 pr-2 font-semibold">Unit</th>
              <th className="py-2 pr-2 text-right font-semibold">Rate</th>
              <th className="py-2 pr-0 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {proposal.items.map((item, idx) => (
              <tr key={item.id} className="border-b border-slate-100">
                <td className="py-2.5 pr-2 align-top text-slate-400">{idx + 1}</td>
                <td className="py-2.5 pr-2 align-top">
                  <div className="font-medium text-slate-800">{item.materialName}</div>
                  {item.description && <div className="text-xs text-slate-400">{item.description}</div>}
                </td>
                <td className="py-2.5 pr-2 text-right align-top text-slate-600">{item.quantity}</td>
                <td className="py-2.5 pr-2 align-top text-slate-600">{item.unit}</td>
                <td className="py-2.5 pr-2 text-right align-top text-slate-600">{formatCurrency(item.sellingPrice, currency)}</td>
                <td className="py-2.5 pr-0 text-right align-top font-medium text-slate-800">{formatCurrency(item.amount, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div data-pdf-block className="mt-6 flex justify-end">
        <div className="w-full max-w-xs space-y-2 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span>{formatCurrency(proposal.subtotal, currency)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Discount ({proposal.discountPercent}%)</span>
            <span>- {formatCurrency(proposal.discountAmount, currency)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Tax / GST ({proposal.taxPercent}%)</span>
            <span>+ {formatCurrency(proposal.taxAmount, currency)}</span>
          </div>
          {proposal.roundOff !== 0 && (
            <div className="flex justify-between text-slate-600">
              <span>Round Off</span>
              <span>{proposal.roundOff > 0 ? "+ " : "- "}{formatCurrency(Math.abs(proposal.roundOff), currency)}</span>
            </div>
          )}
          <div className="flex justify-between border-t-2 border-slate-800 pt-2 text-base font-bold text-slate-900">
            <span>Grand Total</span>
            <span>{formatCurrency(proposal.grandTotal, currency)}</span>
          </div>
        </div>
      </div>

      {proposal.notes && (
        <div data-pdf-block className="mt-8">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Notes</h3>
          <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{proposal.notes}</p>
        </div>
      )}

      {hasBankDetails && (
        <div data-pdf-block className="mt-8">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Payment Details</h3>
          <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-500 sm:grid-cols-4">
            {settings.bankName && (
              <div data-pdf-block>
                <span className="block text-slate-400">Bank</span>
                {settings.bankName}
              </div>
            )}
            {settings.bankAccountName && (
              <div data-pdf-block>
                <span className="block text-slate-400">Account Name</span>
                {settings.bankAccountName}
              </div>
            )}
            {settings.bankAccountNumber && (
              <div data-pdf-block>
                <span className="block text-slate-400">Account Number</span>
                {settings.bankAccountNumber}
              </div>
            )}
            {settings.bankIfscCode && (
              <div data-pdf-block>
                <span className="block text-slate-400">IFSC</span>
                {settings.bankIfscCode}
              </div>
            )}
            {settings.bankBranch && (
              <div data-pdf-block>
                <span className="block text-slate-400">Branch</span>
                {settings.bankBranch}
              </div>
            )}
          </div>
        </div>
      )}

      {proposal.termsAndConditions && (
        <div data-pdf-block className="mt-8">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Terms &amp; Conditions</h3>
          <p className="mt-2 whitespace-pre-line text-xs text-slate-500">{proposal.termsAndConditions}</p>
        </div>
      )}

      <div data-pdf-block className="mt-14 flex justify-between gap-8">
        <div className="w-48">
          <div className="border-t border-slate-400 pt-2 text-xs text-slate-500">Client Signature</div>
        </div>
        <div className="w-48 text-right">
          {settings.signatureUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.signatureUrl} alt="Authorized signature" className="ml-auto h-12 object-contain" />
          )}
          <div className="border-t border-slate-400 pt-2 text-xs text-slate-500">
            Authorized Signature{settings.authorizedSignatory ? ` — ${settings.authorizedSignatory}` : ""}
          </div>
        </div>
      </div>

      <div data-pdf-block className="mt-10 border-t border-slate-100 pt-4 text-center text-xs text-slate-300">
        <div>{settings.footerText || [settings.website, "This is a system-generated proposal."].filter(Boolean).join(" · ")}</div>
        <div className="mt-1 text-[10px] text-slate-300">
          Generated by {APP_INFO.productName} · Powered by {APP_INFO.company}
        </div>
      </div>
    </div>
  );
}
