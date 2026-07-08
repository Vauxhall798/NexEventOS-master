import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseMaterialsFile } from "@/lib/parseMaterials";
import { ApiError, withApiErrorHandling } from "@/lib/apiError";
import { requireRole } from "@/lib/auth";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".xlsx", ".csv"];

export const POST = withApiErrorHandling(async (req: NextRequest) => {
  await requireRole(["ADMIN", "SALES", "MANAGER"]);
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    throw new ApiError(400, "No file uploaded");
  }

  const hasAllowedExtension = ALLOWED_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext));
  if (!hasAllowedExtension) {
    throw new ApiError(400, "Only .xlsx or .csv files are allowed");
  }

  if (file.size > MAX_SIZE_BYTES) {
    throw new ApiError(400, "File must be smaller than 5MB");
  }

  const buffer = await file.arrayBuffer();
  let rows;
  try {
    rows = parseMaterialsFile(buffer);
  } catch {
    throw new ApiError(400, "Could not parse file. Please upload a valid .xlsx or .csv file.");
  }

  if (rows.length === 0) {
    throw new ApiError(400, "No valid rows found in the file");
  }

  let skipped = 0;
  const errors: string[] = [];
  const validRows = rows.filter((row, idx) => {
    if (!row.materialCode || !row.materialName) {
      skipped++;
      errors.push(`Row ${idx + 2}: missing material code or name`);
      return false;
    }
    if (!Number.isFinite(row.costPrice) || row.costPrice < 0 || !Number.isFinite(row.sellingPrice) || row.sellingPrice < 0) {
      skipped++;
      errors.push(`Row ${idx + 2}: cost/selling price must be a non-negative number`);
      return false;
    }
    return true;
  });

  // Pre-fetch categories and existing material codes in bulk instead of one
  // query per row — a few hundred-row import previously issued 2+ sequential
  // queries per row (category upsert + material lookup).
  const categoryNames = Array.from(new Set(validRows.map((row) => row.category || "Uncategorized")));
  const categoryMap = new Map<string, string>();
  for (const name of categoryNames) {
    const category = await prisma.category.upsert({ where: { name }, update: {}, create: { name } });
    categoryMap.set(name, category.id);
  }

  const existingMaterials = await prisma.material.findMany({
    where: { materialCode: { in: validRows.map((row) => row.materialCode) } },
    select: { materialCode: true },
  });
  const existingCodes = new Set(existingMaterials.map((m) => m.materialCode));

  let created = 0;
  let updated = 0;

  for (const row of validRows) {
    const categoryId = categoryMap.get(row.category || "Uncategorized");

    if (existingCodes.has(row.materialCode)) {
      await prisma.material.update({
        where: { materialCode: row.materialCode },
        data: {
          materialName: row.materialName,
          subCategory: row.subCategory || null,
          unit: row.unit,
          costPrice: row.costPrice,
          sellingPrice: row.sellingPrice,
          description: row.description || null,
          categoryId,
          isActive: true,
        },
      });
      updated++;
    } else {
      await prisma.material.create({
        data: {
          materialCode: row.materialCode,
          materialName: row.materialName,
          subCategory: row.subCategory || null,
          unit: row.unit,
          costPrice: row.costPrice,
          sellingPrice: row.sellingPrice,
          description: row.description || null,
          categoryId,
        },
      });
      created++;
    }
  }

  return NextResponse.json({ created, updated, skipped, errors, total: rows.length });
});
