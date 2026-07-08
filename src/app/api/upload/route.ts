import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { ApiError, withApiErrorHandling } from "@/lib/apiError";
import { requireSession } from "@/lib/auth";
import { uploadToStorage } from "@/lib/supabaseStorage";

export const runtime = "nodejs";

// SVG is deliberately excluded: it's an XML format that can embed <script>/
// event handlers, and uploaded files are served directly from /uploads/ at
// this app's own origin — opening the raw file URL would execute attacker
// script in our origin (stored XSS). Raster-only avoids that class of bug
// without needing a sanitizer dependency.
const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

const MAX_SIZE_BYTES = 5 * 1024 * 1024;

// Generic image upload for logo/signature (and future material images).
// Filenames are always server-generated (uuid) — never derived from the
// client-supplied name — to avoid path traversal.
export const POST = withApiErrorHandling(async (req: NextRequest) => {
  await requireSession();
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    throw new ApiError(400, "No file uploaded");
  }

  const extension = ALLOWED_TYPES[file.type];
  if (!extension) {
    throw new ApiError(400, "Only PNG, JPEG, or WEBP images are allowed");
  }

  if (file.size > MAX_SIZE_BYTES) {
    throw new ApiError(400, "File must be smaller than 5MB");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${randomUUID()}.${extension}`;
  const url = await uploadToStorage(filename, buffer, file.type);

  return NextResponse.json({ url }, { status: 201 });
});
