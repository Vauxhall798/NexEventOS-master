import * as XLSX from "xlsx";

export interface ParsedMaterialRow {
  materialCode: string;
  materialName: string;
  category: string;
  subCategory: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  description: string;
}

const HEADER_ALIASES: Record<string, keyof ParsedMaterialRow> = {
  "material code": "materialCode",
  "materialcode": "materialCode",
  "code": "materialCode",
  "material name": "materialName",
  "materialname": "materialName",
  "name": "materialName",
  "category": "category",
  "sub category": "subCategory",
  "subcategory": "subCategory",
  "sub-category": "subCategory",
  "unit": "unit",
  "uom": "unit",
  "cost price": "costPrice",
  "costprice": "costPrice",
  "cost": "costPrice",
  "selling price": "sellingPrice",
  "sellingprice": "sellingPrice",
  "price": "sellingPrice",
  "description": "description",
};

function normalizeHeader(header: string): keyof ParsedMaterialRow | null {
  const key = header.trim().toLowerCase();
  return HEADER_ALIASES[key] ?? null;
}

export function parseMaterialsFile(buffer: ArrayBuffer): ParsedMaterialRow[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  const parsed: ParsedMaterialRow[] = [];

  for (const row of rows) {
    const mapped: Partial<ParsedMaterialRow> = {};
    for (const [rawHeader, value] of Object.entries(row)) {
      const field = normalizeHeader(rawHeader);
      if (!field) continue;
      if (field === "costPrice" || field === "sellingPrice") {
        mapped[field] = parseFloat(String(value).replace(/[^0-9.-]/g, "")) || 0;
      } else {
        mapped[field] = String(value ?? "").trim();
      }
    }

    if (!mapped.materialCode && !mapped.materialName) continue;

    parsed.push({
      materialCode: mapped.materialCode || "",
      materialName: mapped.materialName || "",
      category: mapped.category || "Uncategorized",
      subCategory: mapped.subCategory || "",
      unit: mapped.unit || "Nos",
      costPrice: mapped.costPrice ?? 0,
      sellingPrice: mapped.sellingPrice ?? 0,
      description: mapped.description || "",
    });
  }

  return parsed;
}
