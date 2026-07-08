import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { withApiErrorHandling } from "@/lib/apiError";

export const GET = withApiErrorHandling(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const sort = searchParams.get("sort") ?? "recent"; // recent | name | revenue | proposals
  const filter = searchParams.get("filter") ?? "all"; // all | withProposals | noProposals

  const where: Prisma.ClientWhereInput = q
    ? {
        OR: [
          { clientName: { contains: q, mode: "insensitive" } },
          { company: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { phone: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const clients = await prisma.client.findMany({
    where,
    include: { proposals: { select: { grandTotal: true, createdAt: true } } },
    take: 1000,
  });

  let withStats = clients.map((c) => {
    const { proposals, ...rest } = c;
    const totalProposals = proposals.length;
    const totalRevenue = proposals.reduce((sum, p) => sum + p.grandTotal, 0);
    const lastProposalDate = proposals.reduce<Date | null>((latest, p) => (!latest || p.createdAt > latest ? p.createdAt : latest), null);
    return { ...rest, totalProposals, totalRevenue, lastProposalDate };
  });

  if (filter === "withProposals") withStats = withStats.filter((c) => c.totalProposals > 0);
  if (filter === "noProposals") withStats = withStats.filter((c) => c.totalProposals === 0);

  withStats.sort((a, b) => {
    if (sort === "revenue") return b.totalRevenue - a.totalRevenue;
    if (sort === "proposals") return b.totalProposals - a.totalProposals;
    if (sort === "name") return a.clientName.localeCompare(b.clientName);
    const at = a.lastProposalDate?.getTime() ?? 0;
    const bt = b.lastProposalDate?.getTime() ?? 0;
    return bt - at;
  });

  return NextResponse.json({ clients: withStats });
});
