import type { jsPDF } from "jspdf";

export interface PixelRange {
  top: number;
  bottom: number;
}

/**
 * Given the full captured height and a list of "do not split" ranges,
 * returns the Y coordinates (in the same px space as the ranges) where
 * each page should end. Every returned break point falls in a gap between
 * protected ranges — never inside one — by snapping an over-long page back
 * to the top of whichever protected element it collided with.
 */
export function computeBreakPoints(totalHeightPx: number, maxPageHeightPx: number, protectedRanges: PixelRange[]): number[] {
  // ignore anything already taller than a full page — nothing we can do but let it split
  const ranges = protectedRanges.filter((r) => r.bottom - r.top < maxPageHeightPx);

  function nearestSafeBreak(candidateY: number, floorY: number): number {
    const collision = ranges.find((r) => candidateY > r.top && candidateY < r.bottom);
    if (!collision) return candidateY;
    return collision.top > floorY ? collision.top : candidateY;
  }

  const breaks: number[] = [];
  let cursor = 0;

  while (cursor < totalHeightPx - 1) {
    const rawBreak = Math.min(cursor + maxPageHeightPx, totalHeightPx);
    const breakY = rawBreak >= totalHeightPx ? rawBreak : nearestSafeBreak(rawBreak, cursor);
    const safeBreakY = Math.max(cursor + 1, breakY);
    breaks.push(safeBreakY);
    cursor = safeBreakY;
  }

  return breaks;
}

/**
 * Splits a full-page html2canvas snapshot across multiple PDF pages without
 * cutting through content. Naively slicing the image at a fixed pixel
 * height (the common jsPDF+html2canvas recipe) chops whatever happens to
 * sit at that Y coordinate — e.g. a label ("Branch") ends up on one page
 * and its value ("Andheri East") on the next. Instead, every element
 * tagged `data-pdf-block` (plus every `<tr>`) is treated as atomic: a
 * page break is only allowed in the gap before or after one of these
 * elements, never inside.
 */
export function addPaginatedImage(pdf: jsPDF, canvas: HTMLCanvasElement, sourceNode: HTMLElement, captureScale: number) {
  const pageWidthPt = pdf.internal.pageSize.getWidth();
  const pageHeightPt = pdf.internal.pageSize.getHeight();

  // canvas px -> pt, derived from fitting the captured width to the page width
  const pxToPt = pageWidthPt / canvas.width;
  const maxPageHeightPx = pageHeightPt / pxToPt;

  const sourceRect = sourceNode.getBoundingClientRect();
  const protectedRanges: PixelRange[] = Array.from(sourceNode.querySelectorAll<HTMLElement>("[data-pdf-block], table tr")).map((el) => {
    const rect = el.getBoundingClientRect();
    return {
      top: (rect.top - sourceRect.top) * captureScale,
      bottom: (rect.bottom - sourceRect.top) * captureScale,
    };
  });

  const breakPoints = computeBreakPoints(canvas.height, maxPageHeightPx, protectedRanges);

  let cursor = 0;
  breakPoints.forEach((breakY, pageIndex) => {
    const sliceHeightPx = breakY - cursor;

    const sliceCanvas = document.createElement("canvas");
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = sliceHeightPx;
    const ctx = sliceCanvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(canvas, 0, cursor, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx);

    if (pageIndex > 0) pdf.addPage();
    pdf.addImage(sliceCanvas.toDataURL("image/png"), "PNG", 0, 0, pageWidthPt, sliceHeightPx * pxToPt);

    cursor = breakY;
  });
}
