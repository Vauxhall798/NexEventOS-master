/**
 * One-time SQLite -> Postgres data migration: export step.
 *
 * Run this BEFORE switching prisma/schema.prisma's datasource provider to
 * "postgresql" — once the client is regenerated against Postgres, it can no
 * longer open the old SQLite file at all (different query engine).
 *
 * Usage:
 *   npx tsx prisma/export-sqlite-data.ts
 *
 * Writes prisma/sqlite-export.json (gitignored) containing every row from
 * every table, in dependency order. See prisma/import-postgres-data.ts for
 * the matching import step.
 */
import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  const [categories, users, materials, clients, companySettings, proposals, proposalItems] = await Promise.all([
    prisma.category.findMany(),
    prisma.user.findMany(),
    prisma.material.findMany(),
    prisma.client.findMany(),
    prisma.companySettings.findMany(),
    prisma.proposal.findMany(),
    prisma.proposalItem.findMany(),
  ]);

  const dump = { categories, users, materials, clients, companySettings, proposals, proposalItems };

  const counts = Object.fromEntries(Object.entries(dump).map(([k, v]) => [k, v.length]));
  console.log("Exporting row counts:", counts);

  const outPath = path.join(__dirname, "sqlite-export.json");
  writeFileSync(outPath, JSON.stringify(dump, null, 2));
  console.log(`Wrote ${outPath}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
