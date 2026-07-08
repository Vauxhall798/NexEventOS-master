import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ApiError, withApiErrorHandling } from "@/lib/apiError";
import { requireRole } from "@/lib/auth";

export const GET = withApiErrorHandling(async () => {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ categories });
});

export const POST = withApiErrorHandling(async (req: NextRequest) => {
  await requireRole(["ADMIN", "SALES", "MANAGER"]);
  const body = await req.json();
  const name = String(body.name ?? "").trim();
  if (!name) {
    throw new ApiError(400, "Category name is required");
  }
  const category = await prisma.category.upsert({
    where: { name },
    update: {},
    create: { name },
  });
  return NextResponse.json({ category }, { status: 201 });
});
