import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { ApiError, withApiErrorHandling } from "@/lib/apiError";
import { requireRole } from "@/lib/auth";

export const GET = withApiErrorHandling(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const category = searchParams.get("category")?.trim();

  const where: Prisma.MaterialWhereInput = { isActive: true };

  if (q) {
    where.OR = [
      { materialName: { contains: q, mode: "insensitive" } },
      { materialCode: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  if (category && category !== "all") {
    where.categoryId = category;
  }

  const materials = await prisma.material.findMany({
    where,
    include: { category: true },
    orderBy: { materialName: "asc" },
    take: 1000,
  });

  return NextResponse.json({ materials });
});

/** Parses a price field as a finite, non-negative number; throws a 400 ApiError otherwise. */
function parsePrice(value: unknown, label: string): number {
  const num = parseFloat(String(value ?? ""));
  if (!Number.isFinite(num) || num < 0) {
    throw new ApiError(400, `${label} must be a non-negative number`);
  }
  return num;
}

export const POST = withApiErrorHandling(async (req: NextRequest) => {
  await requireRole(["ADMIN", "SALES", "MANAGER"]);
  const body = await req.json();

  const materialCode = String(body.materialCode ?? "").trim();
  const materialName = String(body.materialName ?? "").trim();
  const unit = String(body.unit ?? "").trim();

  if (!materialCode || !materialName || !unit) {
    throw new ApiError(400, "Material code, name, and unit are required");
  }

  const costPrice = parsePrice(body.costPrice, "Cost price");
  const sellingPrice = parsePrice(body.sellingPrice, "Selling price");

  const existing = await prisma.material.findUnique({ where: { materialCode } });
  if (existing) {
    throw new ApiError(409, `Material code "${materialCode}" already exists`);
  }

  let categoryId: string | undefined;
  if (body.categoryName) {
    const category = await prisma.category.upsert({
      where: { name: String(body.categoryName).trim() },
      update: {},
      create: { name: String(body.categoryName).trim() },
    });
    categoryId = category.id;
  }

  const material = await prisma.material.create({
    data: {
      materialCode,
      materialName,
      unit,
      subCategory: body.subCategory || null,
      costPrice,
      sellingPrice,
      description: body.description || null,
      imageUrl: body.imageUrl || null,
      categoryId,
    },
    include: { category: true },
  });

  return NextResponse.json({ material }, { status: 201 });
});
