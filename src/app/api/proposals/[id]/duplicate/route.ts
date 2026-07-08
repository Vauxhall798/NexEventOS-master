import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createWithProposalNumber } from "@/lib/proposalNumber";
import { getCompanySettings } from "@/lib/companySettings";
import { ApiError, withApiErrorHandling } from "@/lib/apiError";
import { requireRole } from "@/lib/auth";

interface Params {
  params: { id: string };
}

export const POST = withApiErrorHandling(async (_req: NextRequest, { params }: Params) => {
  await requireRole(["ADMIN", "SALES", "MANAGER"]);
  const original = await prisma.proposal.findUnique({
    where: { id: params.id },
    include: { items: true },
  });

  if (!original) throw new ApiError(404, "Proposal not found");

  const companySettings = await getCompanySettings();

  const duplicate = await createWithProposalNumber(companySettings.proposalPrefix, (proposalNumber) =>
    prisma.proposal.create({
      data: {
        proposalNumber,
        status: "DRAFT",
        clientId: original.clientId,
        clientName: original.clientName,
        company: original.company,
        contactPerson: original.contactPerson,
        email: original.email,
        phone: original.phone,
        eventName: `${original.eventName} (Copy)`,
        eventDate: original.eventDate,
        venue: original.venue,
        proposalDate: new Date(),
        salesPersonId: original.salesPersonId,
        salesPersonName: original.salesPersonName,
        notes: original.notes,
        discountPercent: original.discountPercent,
        discountAmount: original.discountAmount,
        taxPercent: original.taxPercent,
        taxAmount: original.taxAmount,
        subtotal: original.subtotal,
        roundOff: original.roundOff,
        grandTotal: original.grandTotal,
        termsAndConditions: original.termsAndConditions,
        duplicatedFromId: original.id,
        items: {
          create: original.items.map((it) => ({
            materialId: it.materialId,
            materialName: it.materialName,
            description: it.description,
            unit: it.unit,
            sellingPrice: it.sellingPrice,
            quantity: it.quantity,
            amount: it.amount,
            sortOrder: it.sortOrder,
          })),
        },
      },
      include: { items: true },
    })
  );

  return NextResponse.json({ proposal: duplicate }, { status: 201 });
});
