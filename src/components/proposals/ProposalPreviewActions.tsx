"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ToastProvider";
import { addPaginatedImage } from "@/lib/pdfPagination";
import type { Proposal } from "@/types";

export function ProposalPreviewActions({ proposal }: { proposal: Proposal }) {
  const [exporting, setExporting] = useState(false);
  const { showToast } = useToast();

  async function handleDownloadPdf() {
    setExporting(true);
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([import("jspdf"), import("html2canvas")]);
      const node = document.getElementById("print-area");
      if (!node) return;

      const scale = 2;
      const canvas = await html2canvas(node, { scale, useCORS: true, backgroundColor: "#ffffff" });

      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      addPaginatedImage(pdf, canvas, node, scale);

      pdf.save(`${proposal.proposalNumber}.pdf`);
      showToast("PDF downloaded");
    } catch {
      showToast("Failed to generate PDF", "error");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 no-print">
      <Link href={`/proposals/${proposal.id}/edit`} className="text-sm font-medium text-brand-600 hover:underline">
        &larr; Back to Edit
      </Link>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => window.print()}>
          <PrintIcon className="h-4 w-4" /> Print
        </Button>
        <Button onClick={handleDownloadPdf} loading={exporting}>
          <DownloadIcon className="h-4 w-4" /> Download PDF
        </Button>
      </div>
    </div>
  );
}

function PrintIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M6 9V4h12v5M6 18H4a1 1 0 01-1-1v-5a1 1 0 011-1h16a1 1 0 011 1v5a1 1 0 01-1 1h-2M6 14h12v7H6v-7z" />
    </svg>
  );
}
function DownloadIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
    </svg>
  );
}
