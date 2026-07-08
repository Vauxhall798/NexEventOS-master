import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PROPOSAL_STATUSES } from "@/lib/proposalStatus";
import type { ProposalStatus } from "@/types";
import { ApiError, withApiErrorHandling } from "@/lib/apiError";
import { requireRole } from "@/lib/auth";

interface Params {
  params: { id: string };
}

export const GET = withApiErrorHandling(async (_req: NextRequest, { params }: Params) => {
  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      proposals: {
        orderBy: { createdAt: "desc" },
        select: { id: true, proposalNumber: true, eventName: true, status: true, grandTotal: true, createdAt: true },
      },
    },
  });

  if (!client) throw new ApiError(404, "Client not found");

  const { proposals } = client;
  const totalProposals = proposals.length;
  const totalRevenue = proposals.reduce((sum, p) => sum + p.grandTotal, 0);
  const lastProposalDate = proposals.reduce<Date | null>((latest, p) => (!latest || p.createdAt > latest ? p.createdAt : latest), null);

  const statusDistribution = PROPOSAL_STATUSES.reduce(
    (acc, status) => {
      acc[status] = proposals.filter((p) => p.status === status).length;
      return acc;
    },
    {} as Record<ProposalStatus, number>
  );

  return NextResponse.json({
    client: { ...client, totalProposals, totalRevenue, lastProposalDate, statusDistribution },
  });
});

export const PUT = withApiErrorHandling(async (req: NextRequest, { params }: Params) => {
  await requireRole(["ADMIN", "SALES", "MANAGER"]);
  const body = await req.json();

  const existing = await prisma.client.findUnique({ where: { id: params.id } });
  if (!existing) throw new ApiError(404, "Client not found");

  const clientName = String(body.clientName ?? "").trim();
  if (!clientName) {
    throw new ApiError(400, "Client name is required");
  }

  // Historical proposals keep their own snapshot of client details as of
  // creation time — editing a client here only affects the Client record
  // and future proposals, not documents already generated.
  const client = await prisma.client.update({
    where: { id: params.id },
    data: {
      clientName,
      company: body.company || null,
      contactPerson: body.contactPerson || null,
      email: body.email || null,
      phone: body.phone || null,
    },
  });

  return NextResponse.json({ client });
});

export const DELETE = withApiErrorHandling(async (_req: NextRequest, { params }: Params) => {
  await requireRole(["ADMIN", "SALES", "MANAGER"]);
  const existing = await prisma.client.findUnique({ where: { id: params.id } });
  if (!existing) throw new ApiError(404, "Client not found");

  await prisma.client.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
});
