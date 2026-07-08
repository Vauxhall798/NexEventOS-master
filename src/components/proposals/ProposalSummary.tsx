"use client";

import { clampRoundOff, clampPercent, formatCurrency, round2, suggestRoundOff } from "@/lib/calculations";

interface ProposalSummaryProps {
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  roundOff: number;
  grandTotal: number;
  onDiscountPercentChange: (value: number) => void;
  onTaxPercentChange: (value: number) => void;
  onRoundOffChange: (value: number) => void;
}

export function ProposalSummary({
  subtotal,
  discountPercent,
  discountAmount,
  taxPercent,
  taxAmount,
  roundOff,
  grandTotal,
  onDiscountPercentChange,
  onTaxPercentChange,
  onRoundOffChange,
}: ProposalSummaryProps) {
  const preRoundTotal = round2(subtotal - discountAmount + taxAmount);
  return (
    <div className="ml-auto w-full max-w-sm space-y-3 rounded-xl bg-slate-50 p-5 dark:bg-slate-800/50">
      <Row label="Subtotal" value={formatCurrency(subtotal)} />

      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-slate-500 dark:text-slate-400">Discount %</span>
        <input
          type="number"
          min="0"
          max="100"
          step="0.01"
          value={discountPercent}
          onChange={(e) => onDiscountPercentChange(clampPercent(parseFloat(e.target.value)))}
          className="w-24 rounded-md border border-slate-200 bg-white px-2 py-1 text-right text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900"
        />
      </div>
      <Row label="Discount Amount" value={`- ${formatCurrency(discountAmount)}`} muted />

      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-slate-500 dark:text-slate-400">Tax %</span>
        <input
          type="number"
          min="0"
          max="100"
          step="0.01"
          value={taxPercent}
          onChange={(e) => onTaxPercentChange(clampPercent(parseFloat(e.target.value)))}
          className="w-24 rounded-md border border-slate-200 bg-white px-2 py-1 text-right text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900"
        />
      </div>
      <Row label="Tax Amount" value={`+ ${formatCurrency(taxAmount)}`} muted />

      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-slate-500 dark:text-slate-400">Round Off</span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            title="Round to nearest whole number"
            onClick={() => onRoundOffChange(clampRoundOff(suggestRoundOff(preRoundTotal)))}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <input
            type="number"
            step="0.01"
            value={roundOff}
            onChange={(e) => onRoundOffChange(clampRoundOff(parseFloat(e.target.value)))}
            className="w-24 rounded-md border border-slate-200 bg-white px-2 py-1 text-right text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
      </div>

      <div className="my-2 border-t border-slate-200 dark:border-slate-700" />

      <div className="flex items-center justify-between">
        <span className="text-base font-semibold text-slate-800 dark:text-slate-100">Grand Total</span>
        <span className="text-xl font-bold text-brand-600">{formatCurrency(grandTotal)}</span>
      </div>
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
      <span className={muted ? "text-sm text-slate-500 dark:text-slate-400" : "text-sm font-medium text-slate-800 dark:text-slate-100"}>{value}</span>
    </div>
  );
}
