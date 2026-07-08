import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export interface ClientInput {
  clientName: string;
  company?: string | null;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
}

/** Minimal shape both the global `prisma` client and a `$transaction` callback's `tx` satisfy. */
type ClientDb = Pick<typeof prisma, "client">;

/**
 * Finds an existing Client to attach a new proposal to instead of always
 * inserting a fresh row (the previous behavior — every proposal created its
 * own Client, so the same real client ended up with one row per proposal
 * and Client Management's aggregates were meaningless).
 *
 * Matches by email first (the most reliable identifier we collect), falling
 * back to an exact clientName match when no email is given on either side.
 * On a match, refreshes the stored contact details to the latest values.
 *
 * Accepts an optional transaction client so callers can run this as part of
 * a larger atomic operation (e.g. client + proposal + items all-or-nothing).
 */
export async function findOrCreateClient(input: ClientInput, db: ClientDb = prisma) {
  const clientName = input.clientName.trim();
  const email = input.email?.trim() || null;

  const where: Prisma.ClientWhereInput = email
    ? { email }
    : { clientName: { equals: clientName }, email: null };

  const existing = await db.client.findFirst({ where });

  const data = {
    clientName,
    company: input.company || null,
    contactPerson: input.contactPerson || null,
    email,
    phone: input.phone || null,
  };

  if (existing) {
    return db.client.update({ where: { id: existing.id }, data });
  }

  return db.client.create({ data });
}
