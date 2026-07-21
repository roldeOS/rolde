/**
 * Client-side image shrink (Photo tool M1, Roland 2026-07-22) — the "magic in
 * the background" that keeps our storage sane: every photo is converted, in the
 * browser, to a compact JPEG master (long edge ≤ 2048) plus a SQUARE thumbnail
 * (512) before a single byte is uploaded. EXIF orientation is honoured; EXIF
 * (incl. GPS) is dropped by the canvas re-encode. An unreadable format (e.g.
 * HEIC on a browser that can't decode it) throws a friendly error rather than
 * crashing the upload.
 *
 * JPEG (not WebP) is deliberate: canvas WebP ENCODING isn't universal (older
 * Safari/WebKit silently fall back to PNG, which would balloon storage) —
 * JPEG q0.82 encodes everywhere, stays a few hundred KB, and is clinically
 * indistinguishable at this quality.
 */
export type Shrunk = { master: Blob; thumb: Blob; width: number; height: number };

const MASTER_EDGE = 2048;
const THUMB_EDGE = 512;
const MASTER_Q = 0.82;
const THUMB_Q = 0.8;
const MIME = "image/jpeg";

async function decode(file: File): Promise<ImageBitmap> {
  try {
    // imageOrientation:"from-image" bakes in EXIF rotation so the pixels are upright.
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("This image format can’t be read here — please use a JPEG or PNG.");
  }
}

function toJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) =>
        b && b.type === MIME
          ? resolve(b)
          : reject(new Error("Couldn’t process that image — please try again.")),
      MIME,
      quality,
    );
  });
}

/** Scaled master: long edge ≤ MASTER_EDGE (never upscales). */
async function makeMaster(bmp: ImageBitmap): Promise<{ blob: Blob; width: number; height: number }> {
  const scale = Math.min(1, MASTER_EDGE / Math.max(bmp.width, bmp.height));
  const w = Math.max(1, Math.round(bmp.width * scale));
  const h = Math.max(1, Math.round(bmp.height * scale));
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("Couldn’t process that image on this device.");
  ctx.drawImage(bmp, 0, 0, w, h);
  return { blob: await toJpeg(c, MASTER_Q), width: w, height: h };
}

/** Square, centre-cropped thumbnail (the uniform gallery tile Roland asked for
 *  — the whole image is kept in the master; only the TILE is square). */
async function makeThumb(bmp: ImageBitmap): Promise<Blob> {
  const side = Math.min(bmp.width, bmp.height);
  const sx = (bmp.width - side) / 2;
  const sy = (bmp.height - side) / 2;
  const c = document.createElement("canvas");
  c.width = THUMB_EDGE;
  c.height = THUMB_EDGE;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("Couldn’t process that image on this device.");
  ctx.drawImage(bmp, sx, sy, side, side, 0, 0, THUMB_EDGE, THUMB_EDGE);
  return toJpeg(c, THUMB_Q);
}

export async function shrinkImage(file: File): Promise<Shrunk> {
  if (!file.type.startsWith("image/"))
    throw new Error("That’s not an image file.");
  const bmp = await decode(file);
  try {
    const master = await makeMaster(bmp);
    const thumb = await makeThumb(bmp);
    return { master: master.blob, thumb, width: master.width, height: master.height };
  } finally {
    bmp.close?.();
  }
}
