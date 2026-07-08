import { PrismaClient } from "@prisma/client";

// Money/percent fields are stored as Postgres Decimal/Numeric for exact
// precision, but every API route, calculation helper, and frontend
// component in this app expects a plain JS `number` (true since these were
// SQLite Float columns, and nothing about the app layer needs to change
// just because the DB now stores them more precisely). These `result`
// extensions convert Decimal -> number for every model/field that uses it —
// unlike a `query`-level transform, `result` extensions update *both* the
// runtime value and the TypeScript-inferred return type of every query
// (find/create/update/...), so server-side arithmetic on these fields
// still type-checks as plain number arithmetic.
//
// Caveat: result extensions don't reach aggregate()/groupBy() output shapes
// (_sum, _avg, ...). The two call sites that aggregate a Decimal field
// (src/app/page.tsx, src/app/api/dashboard/route.ts — both `_sum:
// { grandTotal: true }`) cast Number(...) manually instead.
function createPrismaClient() {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  return client.$extends({
    result: {
      material: {
        costPrice: { needs: { costPrice: true }, compute: (m) => Number(m.costPrice) },
        sellingPrice: { needs: { sellingPrice: true }, compute: (m) => Number(m.sellingPrice) },
      },
      proposal: {
        discountPercent: { needs: { discountPercent: true }, compute: (p) => Number(p.discountPercent) },
        discountAmount: { needs: { discountAmount: true }, compute: (p) => Number(p.discountAmount) },
        taxPercent: { needs: { taxPercent: true }, compute: (p) => Number(p.taxPercent) },
        taxAmount: { needs: { taxAmount: true }, compute: (p) => Number(p.taxAmount) },
        subtotal: { needs: { subtotal: true }, compute: (p) => Number(p.subtotal) },
        roundOff: { needs: { roundOff: true }, compute: (p) => Number(p.roundOff) },
        grandTotal: { needs: { grandTotal: true }, compute: (p) => Number(p.grandTotal) },
      },
      proposalItem: {
        sellingPrice: { needs: { sellingPrice: true }, compute: (i) => Number(i.sellingPrice) },
        amount: { needs: { amount: true }, compute: (i) => Number(i.amount) },
      },
      companySettings: {
        defaultTaxPercent: { needs: { defaultTaxPercent: true }, compute: (s) => Number(s.defaultTaxPercent) },
      },
    },
  });
}

type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>;

const globalForPrisma = globalThis as unknown as { prisma?: ExtendedPrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
