import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function generateProposalNumber(prefix = "PROP"): Promise<string> {
  const year = new Date().getFullYear();
  const fullPrefix = `${prefix}-${year}-`;

  const last = await prisma.proposal.findFirst({
    where: { proposalNumber: { startsWith: fullPrefix } },
    orderBy: { proposalNumber: "desc" },
  });

  let nextSeq = 1;
  if (last) {
    const parts = last.proposalNumber.split("-");
    const seq = parseInt(parts[parts.length - 1], 10);
    if (!Number.isNaN(seq)) nextSeq = seq + 1;
  }

  return `${fullPrefix}${String(nextSeq).padStart(4, "0")}`;
}

const MAX_NUMBER_ATTEMPTS = 3;

function isDuplicateProposalNumber(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    (Array.isArray(error.meta?.target) ? error.meta.target : []).includes("proposalNumber")
  );
}

/**
 * Generates a proposal number and runs `create` with it, retrying with a
 * freshly-generated number if two concurrent requests raced for the same
 * sequence (unique constraint on `proposalNumber` would otherwise surface
 * as a raw 500 to whichever request loses the race).
 */
export async function createWithProposalNumber<T>(prefix: string, create: (proposalNumber: string) => Promise<T>): Promise<T> {
  for (let attempt = 1; attempt <= MAX_NUMBER_ATTEMPTS; attempt++) {
    const proposalNumber = await generateProposalNumber(prefix);
    try {
      return await create(proposalNumber);
    } catch (error) {
      if (!isDuplicateProposalNumber(error) || attempt === MAX_NUMBER_ATTEMPTS) throw error;
    }
  }
  throw new Error("Failed to generate a unique proposal number");
}
