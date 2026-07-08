import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCompanySettings, SETTINGS_ID } from "@/lib/companySettings";
import { ApiError, withApiErrorHandling } from "@/lib/apiError";
import { clampPercent } from "@/lib/calculations";
import { requireRole } from "@/lib/auth";
import { isOwnStorageUrl } from "@/lib/supabaseStorage";

export const dynamic = "force-dynamic";

export const GET = withApiErrorHandling(async () => {
  const settings = await getCompanySettings();
  return NextResponse.json({ settings });
});

// Keeps generated proposal numbers clean (e.g. "EVT-2026-0001") — strips
// anything that isn't a letter/digit and falls back to "PROP" if left blank.
function sanitizePrefix(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  const cleaned = String(value).trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
  return cleaned || "PROP";
}

// Logo/signature must be one of our own uploads (served from our Supabase
// Storage "uploads" bucket by api/upload) — not an arbitrary external URL.
// Without this, anyone could point these fields at attacker-controlled
// infrastructure, which the PDF export's html2canvas({ useCORS: true })
// would then fetch on every preview.
function sanitizeUploadUrl(value: unknown, label: string): string | null | undefined {
  if (value === undefined) return undefined;
  if (!value) return null;
  const url = String(value);
  if (!isOwnStorageUrl(url)) {
    throw new ApiError(400, `${label} must be uploaded through the file picker`);
  }
  return url;
}

export const PUT = withApiErrorHandling(async (req: NextRequest) => {
  await requireRole(["ADMIN"]);
  const body = await req.json();

  const companyName = String(body.companyName ?? "").trim();
  if (!companyName) {
    throw new ApiError(400, "Company name is required");
  }

  const logoUrl = sanitizeUploadUrl(body.logoUrl, "Logo");
  const signatureUrl = sanitizeUploadUrl(body.signatureUrl, "Signature");

  const settings = await prisma.companySettings.upsert({
    where: { id: SETTINGS_ID },
    update: {
      companyName,
      logoUrl,
      gstNumber: body.gstNumber || null,
      panNumber: body.panNumber || null,
      address: body.address || null,
      phone: body.phone || null,
      email: body.email || null,
      website: body.website || null,
      bankName: body.bankName || null,
      bankAccountName: body.bankAccountName || null,
      bankAccountNumber: body.bankAccountNumber || null,
      bankIfscCode: body.bankIfscCode || null,
      bankBranch: body.bankBranch || null,
      authorizedSignatory: body.authorizedSignatory || null,
      signatureUrl,
      defaultTaxPercent: body.defaultTaxPercent !== undefined ? clampPercent(parseFloat(body.defaultTaxPercent)) : undefined,
      currency: body.currency || undefined,
      proposalPrefix: sanitizePrefix(body.proposalPrefix),
      footerText: body.footerText || null,
      termsAndConditions: body.termsAndConditions || null,
    },
    create: {
      id: SETTINGS_ID,
      companyName,
      logoUrl,
      gstNumber: body.gstNumber || null,
      panNumber: body.panNumber || null,
      address: body.address || null,
      phone: body.phone || null,
      email: body.email || null,
      website: body.website || null,
      bankName: body.bankName || null,
      bankAccountName: body.bankAccountName || null,
      bankAccountNumber: body.bankAccountNumber || null,
      bankIfscCode: body.bankIfscCode || null,
      bankBranch: body.bankBranch || null,
      authorizedSignatory: body.authorizedSignatory || null,
      signatureUrl,
      defaultTaxPercent: body.defaultTaxPercent !== undefined ? clampPercent(parseFloat(body.defaultTaxPercent)) : undefined,
      currency: body.currency || undefined,
      proposalPrefix: sanitizePrefix(body.proposalPrefix) ?? "PROP",
      footerText: body.footerText || null,
      termsAndConditions: body.termsAndConditions || null,
    },
  });

  return NextResponse.json({ settings });
});
