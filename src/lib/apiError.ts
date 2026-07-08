import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

/** Thrown by route handlers to short-circuit with a specific status + message. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

const FRIENDLY_UNIQUE_FIELDS: Record<string, string> = {
  materialCode: "That material code is already in use",
  proposalNumber: "That proposal number is already in use",
  email: "That email is already in use",
  name: "That name is already in use",
};

/**
 * Maps a caught error to a safe, friendly JSON response — never forwards a
 * raw Prisma/driver error (schema/column/connection-string details) to the
 * client. The original error is still logged server-side for diagnosis.
 */
function toResponse(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const field = Array.isArray(error.meta?.target) ? String(error.meta.target[0]) : String(error.meta?.target ?? "");
      return NextResponse.json({ error: FRIENDLY_UNIQUE_FIELDS[field] ?? "This record already exists" }, { status: 409 });
    }
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }
    if (error.code === "P2003") {
      return NextResponse.json({ error: "This action references a record that no longer exists" }, { status: 409 });
    }
  }

  console.error(error);
  return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
}

/** Wraps a Next.js route handler so every thrown error becomes a safe JSON response instead of leaking internals. */
export function withApiErrorHandling<Args extends unknown[]>(
  handler: (...args: Args) => Promise<NextResponse>
): (...args: Args) => Promise<NextResponse> {
  return async (...args: Args) => {
    try {
      return await handler(...args);
    } catch (error) {
      return toResponse(error);
    }
  };
}
