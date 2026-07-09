import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withApiErrorHandling } from "@/lib/apiError";

export const dynamic = "force-dynamic";

interface SearchResult {
  type: "proposal" | "client" | "material";
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

export const GET = withApiErrorHandling(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  if (!q) return NextResponse.json({ results: [] });

  const [proposals, materials, clients] = await Promise.all([
    prisma.proposal.findMany({
      where: {
        OR: [
          { clientName: { contains: q, mode: "insensitive" } },
          { proposalNumber: { contains: q, mode: "insensitive" } },
          { eventName: { contains: q, mode: "insensitive" } },
          { items: { some: { materialName: { contains: q, mode: "insensitive" } } } },
        ],
      },
      take: 6,
      orderBy: { createdAt: "desc" },
    }),
    prisma.material.findMany({
      where: {
        isActive: true,
        OR: [{ materialName: { contains: q, mode: "insensitive" } }, { materialCode: { contains: q, mode: "insensitive" } }],
      },
      take: 5,
    }),
    prisma.client.findMany({
      where: {
        OR: [{ clientName: { contains: q, mode: "insensitive" } }, { company: { contains: q, mode: "insensitive" } }],
      },
      take: 5,
    }),
  ]);

  const results: SearchResult[] = [
    ...proposals.map((p) => ({
      type: "proposal" as const,
      id: p.id,
      title: `${p.proposalNumber} — ${p.eventName}`,
      subtitle: `${p.clientName} · ${p.status}`,
      href: `/proposals/${p.id}/edit`,
    })),
    ...clients.map((c) => ({
      type: "client" as const,
      id: c.id,
      title: c.clientName,
      subtitle: c.company || "Client",
      href: `/clients/${c.id}`,
    })),
    ...materials.map((m) => ({
      type: "material" as const,
      id: m.id,
      title: m.materialName,
      subtitle: `${m.materialCode} · Material`,
      href: `/materials`,
    })),
  ];

  return NextResponse.json({ results });
});
