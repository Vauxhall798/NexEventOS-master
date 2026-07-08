import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { clampPercent, computeTotals } from "@/lib/calculations";
import { isProposalStatus } from "@/lib/proposalStatus";
import { ApiError, withApiErrorHandling } from "@/lib/apiError";
import { requireRole } from "@/lib/auth";

interface Params {
  params: { id: string };
}

interface ProposalItemInput {
  materialId?: string;
  materialName: string;
  description?: string;
  unit: string;
  sellingPrice: number;
  quantity: number;
}

/** Validates and normalizes proposal line items — rejects negative/non-finite price or quantity. */
function validateItems(rawItems: unknown): ProposalItemInput[] {
  const items = Array.isArray(rawItems) ? rawItems : [];
  return items.map((raw, idx) => {
    const it = raw as Partial<ProposalItemInput>;
    const materialName = String(it.materialName ?? "").trim();
    const unit = String(it.unit ?? "").trim();
    const sellingPrice = Number(it.sellingPrice);
    const quantity = Number(it.quantity);

    if (!materialName || !unit) {
      throw new ApiError(400, `Item ${idx + 1}: material name and unit are required`);
    }
    if (!Number.isFinite(sellingPrice) || sellingPrice < 0) {
      throw new ApiError(400, `Item ${idx + 1}: rate must be a non-negative number`);
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new ApiError(400, `Item ${idx + 1}: quantity must be greater than zero`);
    }

    return {
      materialId: it.materialId || undefined,
      materialName,
      description: it.description ?? undefined,
      unit,
      sellingPrice,
      quantity,
    };
  });
}

export const GET = withApiErrorHandling(async (_req: NextRequest, { params }: Params) => {
  const proposal = await prisma.proposal.findUnique({
    where: { id: params.id },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
  if (!proposal) throw new ApiError(404, "Proposal not found");
  return NextResponse.json({ proposal });
});

export const PUT = withApiErrorHandling(async (req: NextRequest, { params }: Params) => {
  await requireRole(["ADMIN", "SALES", "MANAGER"]);
  const body = await req.json();

  const existing = await prisma.proposal.findUnique({ where: { id: params.id } });
  if (!existing) throw new ApiError(404, "Proposal not found");

  if (body.status !== undefined && !isProposalStatus(body.status)) {
    throw new ApiError(400, "Invalid proposal status");
  }

  const items = validateItems(body.items);
  const subtotal = items.reduce((sum, it) => sum + it.sellingPrice * it.quantity, 0);
  const discountPercent = clampPercent(parseFloat(body.discountPercent));
  const taxPercent = clampPercent(parseFloat(body.taxPercent));
  const totals = computeTotals({ subtotal, discountPercent, taxPercent, roundOff: parseFloat(body.roundOff) });

  const proposal = await prisma.$transaction(async (tx) => {
    await tx.proposalItem.deleteMany({ where: { proposalId: params.id } });

    return tx.proposal.update({
      where: { id: params.id },
      data: {
        status: body.status ?? undefined,
        clientName: body.clientName ?? undefined,
        company: body.company ?? undefined,
        contactPerson: body.contactPerson ?? undefined,
        email: body.email ?? undefined,
        phone: body.phone ?? undefined,
        eventName: body.eventName ?? undefined,
        eventDate: body.eventDate ? new Date(body.eventDate) : null,
        venue: body.venue ?? undefined,
        proposalDate: body.proposalDate ? new Date(body.proposalDate) : undefined,
        salesPersonName: body.salesPersonName ?? undefined,
        notes: body.notes ?? undefined,
        discountPercent,
        discountAmount: totals.discountAmount,
        taxPercent,
        taxAmount: totals.taxAmount,
        subtotal: totals.subtotal,
        roundOff: totals.roundOff,
        grandTotal: totals.grandTotal,
        termsAndConditions: body.termsAndConditions ?? undefined,
        items: {
          create: items.map((it, idx) => ({
            materialId: it.materialId || null,
            materialName: it.materialName,
            description: it.description || null,
            unit: it.unit,
            sellingPrice: it.sellingPrice,
            quantity: it.quantity,
            amount: it.sellingPrice * it.quantity,
            sortOrder: idx,
          })),
        },
      },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    });
  });

  return NextResponse.json({ proposal });
});

export const PATCH = withApiErrorHandling(async (req: NextRequest, { params }: Params) => {
  await requireRole(["ADMIN", "SALES", "MANAGER"]);
  const body = await req.json();

  const existing = await prisma.proposal.findUnique({ where: { id: params.id } });
  if (!existing) throw new ApiError(404, "Proposal not found");

  if (!isProposalStatus(body.status)) {
    throw new ApiError(400, "Invalid status");
  }

  const proposal = await prisma.proposal.update({
    where: { id: params.id },
    data: { status: body.status },
    include: { items: true },
  });

  return NextResponse.json({ proposal });
});

export const DELETE = withApiErrorHandling(async (_req: NextRequest, { params }: Params) => {
  await requireRole(["ADMIN", "SALES", "MANAGER"]);
  const existing = await prisma.proposal.findUnique({ where: { id: params.id } });
  if (!existing) throw new ApiError(404, "Proposal not found");

  await prisma.proposal.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
});
