import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { createWithProposalNumber } from "@/lib/proposalNumber";
import { clampPercent, computeTotals } from "@/lib/calculations";
import { getCompanySettings } from "@/lib/companySettings";
import { isProposalStatus } from "@/lib/proposalStatus";
import { findOrCreateClient } from "@/lib/clients";
import { ApiError, withApiErrorHandling } from "@/lib/apiError";
import { requireRole, authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

export const dynamic = "force-dynamic";

export const GET = withApiErrorHandling(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const status = searchParams.get("status")?.trim();

  const where: Prisma.ProposalWhereInput = {};

  if (status && status !== "all" && isProposalStatus(status)) {
    where.status = status;
  }

  if (q) {
    where.OR = [
      { clientName: { contains: q, mode: "insensitive" } },
      { proposalNumber: { contains: q, mode: "insensitive" } },
      { eventName: { contains: q, mode: "insensitive" } },
      { company: { contains: q, mode: "insensitive" } },
    ];
  }

  const proposals = await prisma.proposal.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return NextResponse.json({ proposals });
});

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

export const POST = withApiErrorHandling(async (req: NextRequest) => {
  const session = await getServerSession(authOptions);
  const body = await req.json();

  if (!session) {
    // Unauthenticated creation is allowed, but always forced to DRAFT
    body.status = "DRAFT";
  } else {
    // Authenticated creation requires one of these roles
    if (!["ADMIN", "SALES", "MANAGER"].includes(session.user.role)) {
      throw new ApiError(403, "You don't have permission to do this");
    }
  }

  const clientName = String(body.clientName ?? "").trim();
  const eventName = String(body.eventName ?? "").trim();

  if (!clientName || !eventName) {
    throw new ApiError(400, "Client name and event name are required");
  }

  const items = validateItems(body.items);
  const subtotal = items.reduce((sum, it) => sum + it.sellingPrice * it.quantity, 0);
  const discountPercent = clampPercent(parseFloat(body.discountPercent));
  const taxPercent = clampPercent(parseFloat(body.taxPercent));
  const totals = computeTotals({ subtotal, discountPercent, taxPercent, roundOff: parseFloat(body.roundOff) });

  const companySettings = await getCompanySettings();

  const proposal = await createWithProposalNumber(companySettings.proposalPrefix, (proposalNumber) =>
    prisma.$transaction(async (tx) => {
      const client = await findOrCreateClient(
        {
          clientName,
          company: body.company,
          contactPerson: body.contactPerson,
          email: body.email,
          phone: body.phone,
        },
        tx
      );

      return tx.proposal.create({
        data: {
          // mark reviewed based on whether the request is authenticated
          isReviewed: !!session,
          proposalNumber,
          status: body.status === "SENT" ? "SENT" : "DRAFT",
          clientId: client.id,
          clientName,
          company: body.company || null,
          contactPerson: body.contactPerson || null,
          email: body.email || null,
          phone: body.phone || null,
          eventName,
          eventDate: body.eventDate ? new Date(body.eventDate) : null,
          venue: body.venue || null,
          proposalDate: body.proposalDate ? new Date(body.proposalDate) : new Date(),
          salesPersonName: body.salesPersonName || null,
          notes: body.notes || null,
          discountPercent,
          discountAmount: totals.discountAmount,
          taxPercent,
          taxAmount: totals.taxAmount,
          subtotal: totals.subtotal,
          roundOff: totals.roundOff,
          grandTotal: totals.grandTotal,
          termsAndConditions: body.termsAndConditions || companySettings.termsAndConditions || undefined,
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
        include: { items: true },
      });
    })
  );

  return NextResponse.json({ proposal }, { status: 201 });
});
