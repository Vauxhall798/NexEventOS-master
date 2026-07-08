/**
 * One-time SQLite -> Postgres data migration: import step.
 *
 * Run this AFTER:
 *   1. prisma/export-sqlite-data.ts has produced prisma/sqlite-export.json
 *   2. schema.prisma's datasource has been switched to postgresql
 *   3. `prisma migrate dev` has created the (empty) tables/enums on Supabase
 *
 * Usage:
 *   npx tsx prisma/import-postgres-data.ts
 *
 * Idempotent: uses upsert everywhere, so it's safe to re-run if a prior
 * attempt failed partway through. Original ids/timestamps are preserved
 * exactly (ids are strings/cuid on both sides, so no remapping is needed).
 */
import { readFileSync } from "fs";
import path from "path";
import { prisma } from "../src/lib/db";

interface Dump {
  categories: Array<{ id: string; name: string; createdAt: string }>;
  users: Array<{ id: string; name: string; email: string; role: string; createdAt: string }>;
  materials: Array<{
    id: string;
    materialCode: string;
    materialName: string;
    subCategory: string | null;
    unit: string;
    costPrice: number;
    sellingPrice: number;
    description: string | null;
    imageUrl: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    categoryId: string | null;
  }>;
  clients: Array<{
    id: string;
    clientName: string;
    company: string | null;
    contactPerson: string | null;
    email: string | null;
    phone: string | null;
    createdAt: string;
  }>;
  companySettings: Array<Record<string, unknown>>;
  proposals: Array<Record<string, unknown>>;
  proposalItems: Array<Record<string, unknown>>;
}

function loadDump(): Dump {
  const filePath = path.join(__dirname, "sqlite-export.json");
  return JSON.parse(readFileSync(filePath, "utf-8"));
}

async function main() {
  const dump = loadDump();

  console.log("Importing categories...");
  for (const c of dump.categories) {
    await prisma.category.upsert({
      where: { id: c.id },
      update: {},
      create: { id: c.id, name: c.name, createdAt: new Date(c.createdAt) },
    });
  }

  console.log("Importing users...");
  for (const u of dump.users) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: {},
      create: { id: u.id, name: u.name, email: u.email, role: u.role as never, createdAt: new Date(u.createdAt) },
    });
  }

  console.log("Importing materials...");
  for (const m of dump.materials) {
    await prisma.material.upsert({
      where: { id: m.id },
      update: {},
      create: {
        id: m.id,
        materialCode: m.materialCode,
        materialName: m.materialName,
        subCategory: m.subCategory,
        unit: m.unit,
        costPrice: m.costPrice,
        sellingPrice: m.sellingPrice,
        description: m.description,
        imageUrl: m.imageUrl,
        isActive: m.isActive,
        categoryId: m.categoryId,
        createdAt: new Date(m.createdAt),
        updatedAt: new Date(m.updatedAt),
      },
    });
  }

  console.log("Importing clients...");
  for (const c of dump.clients) {
    await prisma.client.upsert({
      where: { id: c.id },
      update: {},
      create: {
        id: c.id,
        clientName: c.clientName,
        company: c.company,
        contactPerson: c.contactPerson,
        email: c.email,
        phone: c.phone,
        createdAt: new Date(c.createdAt),
      },
    });
  }

  console.log("Importing company settings...");
  for (const s of dump.companySettings) {
    const { id, updatedAt, ...rest } = s as { id: string; updatedAt: string; [k: string]: unknown };
    await prisma.companySettings.upsert({
      where: { id },
      update: {},
      create: { id, ...rest, updatedAt: new Date(updatedAt) } as never,
    });
  }

  console.log("Importing proposals...");
  for (const p of dump.proposals) {
    const { id, createdAt, updatedAt, proposalDate, eventDate, ...rest } = p as Record<string, unknown> & {
      id: string;
      createdAt: string;
      updatedAt: string;
      proposalDate: string;
      eventDate: string | null;
    };
    await prisma.proposal.upsert({
      where: { id },
      update: {},
      create: {
        id,
        ...rest,
        proposalDate: new Date(proposalDate),
        eventDate: eventDate ? new Date(eventDate) : null,
        createdAt: new Date(createdAt),
        updatedAt: new Date(updatedAt),
      } as never,
    });
  }

  console.log("Importing proposal items...");
  for (const it of dump.proposalItems) {
    const { id, ...rest } = it as { id: string; [k: string]: unknown };
    await prisma.proposalItem.upsert({
      where: { id },
      update: {},
      create: { id, ...rest } as never,
    });
  }

  console.log("\nImport complete. Verifying row counts...");
  const [categories, users, materials, clients, settings, proposals, items] = await Promise.all([
    prisma.category.count(),
    prisma.user.count(),
    prisma.material.count(),
    prisma.client.count(),
    prisma.companySettings.count(),
    prisma.proposal.count(),
    prisma.proposalItem.count(),
  ]);

  console.log({ categories, users, materials, clients, settings, proposals, items });
  console.log("\nCompare these against the \"Exporting row counts\" line printed by export-sqlite-data.ts.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
