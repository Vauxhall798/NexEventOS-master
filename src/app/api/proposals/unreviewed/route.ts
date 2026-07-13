import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withApiErrorHandling } from "@/lib/apiError";

export const GET = withApiErrorHandling(async (req: NextRequest) => {
  const count = await prisma.proposal.count({ where: { isReviewed: false } });
  return NextResponse.json({ count });
});
