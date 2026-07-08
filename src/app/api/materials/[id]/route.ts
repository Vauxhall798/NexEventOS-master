import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ApiError, withApiErrorHandling } from "@/lib/apiError";
import { requireRole } from "@/lib/auth";

interface Params {
  params: { id: string };
}

/** Parses a price field as a finite, non-negative number; throws a 400 ApiError otherwise. */
function parsePrice(value: unknown, label: string): number {
  const num = parseFloat(String(value ?? ""));
  if (!Number.isFinite(num) || num < 0) {
    throw new ApiError(400, `${label} must be a non-negative number`);
  }
  return num;
}

export const GET = withApiErrorHandling(async (_req: NextRequest, { params }: Params) => {
  const material = await prisma.material.findUnique({ where: { id: params.id }, include: { category: true } });
  if (!material) throw new ApiError(404, "Material not found");
  return NextResponse.json({ material });
});

export const PUT = withApiErrorHandling(async (req: NextRequest, { params }: Params) => {
  await requireRole(["ADMIN", "SALES", "MANAGER"]);
  const body = await req.json();

  const existing = await prisma.material.findUnique({ where: { id: params.id } });
  if (!existing) throw new ApiError(404, "Material not found");

  if (body.materialCode && body.materialCode !== existing.materialCode) {
    const dup = await prisma.material.findUnique({ where: { materialCode: body.materialCode } });
    if (dup) throw new ApiError(409, `Material code "${body.materialCode}" already exists`);
  }

  let categoryId: string | null | undefined = undefined;
  if (body.categoryName !== undefined) {
    if (!body.categoryName) {
      categoryId = null;
    } else {
      const category = await prisma.category.upsert({
        where: { name: String(body.categoryName).trim() },
        update: {},
        create: { name: String(body.categoryName).trim() },
      });
      categoryId = category.id;
    }
  }

  const material = await prisma.material.update({
    where: { id: params.id },
    data: {
      materialCode: body.materialCode ?? undefined,
      materialName: body.materialName ?? undefined,
      unit: body.unit ?? undefined,
      subCategory: body.subCategory ?? undefined,
      costPrice: body.costPrice !== undefined ? parsePrice(body.costPrice, "Cost price") : undefined,
      sellingPrice: body.sellingPrice !== undefined ? parsePrice(body.sellingPrice, "Selling price") : undefined,
      description: body.description ?? undefined,
      imageUrl: body.imageUrl ?? undefined,
      categoryId,
    },
    include: { category: true },
  });

  return NextResponse.json({ material });
});

export const DELETE = withApiErrorHandling(async (_req: NextRequest, { params }: Params) => {
  await requireRole(["ADMIN", "SALES", "MANAGER"]);
  const existing = await prisma.material.findUnique({ where: { id: params.id } });
  if (!existing) throw new ApiError(404, "Material not found");

  await prisma.material.update({ where: { id: params.id }, data: { isActive: false } });
  return NextResponse.json({ success: true });
});
