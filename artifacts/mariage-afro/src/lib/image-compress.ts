export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const ACCEPTED_IMAGE_ATTR = ACCEPTED_IMAGE_TYPES.join(",");

const MAX_RAW_BYTES = 15 * 1024 * 1024;
const MAX_FINAL_BYTES = 5 * 1024 * 1024;

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: "image/jpeg" | "image/webp";
}

export function validateImageInput(file: File): string | null {
  if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return "Format non supporté. Utilisez JPG, PNG ou WebP.";
  }
  if (file.size > MAX_RAW_BYTES) {
    return `Fichier trop volumineux (${(file.size / 1024 / 1024).toFixed(1)} Mo). Maximum 15 Mo.`;
  }
  return null;
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
    }
  }
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Image decode failed")); };
    img.src = url;
  });
}

function dimensions(src: ImageBitmap | HTMLImageElement): { w: number; h: number } {
  const w = "width" in src ? (src as { width: number }).width : 0;
  const h = "height" in src ? (src as { height: number }).height : 0;
  return { w, h };
}

export async function compressImage(file: File, opts: CompressOptions = {}): Promise<File> {
  const { maxWidth = 1920, maxHeight = 1920, quality = 0.82, mimeType = "image/jpeg" } = opts;
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") return file;

  const src = await loadBitmap(file);
  const { w: srcW, h: srcH } = dimensions(src);
  if (!srcW || !srcH) return file;

  const ratio = Math.min(1, maxWidth / srcW, maxHeight / srcH);
  const w = Math.max(1, Math.round(srcW * ratio));
  const h = Math.max(1, Math.round(srcH * ratio));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(src as CanvasImageSource, 0, 0, w, h);
  if ("close" in src && typeof (src as ImageBitmap).close === "function") {
    (src as ImageBitmap).close();
  }

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), mimeType, quality),
  );
  if (!blob) return file;
  if (blob.size >= file.size && file.type === mimeType) return file;

  const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
  const ext = mimeType === "image/webp" ? "webp" : "jpg";
  return new File([blob], `${baseName}.${ext}`, { type: mimeType, lastModified: Date.now() });
}

export async function prepareImageForUpload(file: File, opts?: CompressOptions): Promise<{ file: File; error: string | null }> {
  const err = validateImageInput(file);
  if (err) return { file, error: err };
  try {
    const compressed = await compressImage(file, opts);
    if (compressed.size > MAX_FINAL_BYTES) {
      return { file: compressed, error: `Image encore trop lourde après optimisation (${(compressed.size / 1024 / 1024).toFixed(1)} Mo).` };
    }
    return { file: compressed, error: null };
  } catch (e) {
    return { file, error: (e as Error).message || "Optimisation impossible." };
  }
}
