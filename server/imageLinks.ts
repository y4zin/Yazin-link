const MIME_EXTENSIONS: Record<string, string> = {
  "image/avif": ".avif",
  "image/gif": ".gif",
  "image/heic": ".heic",
  "image/heif": ".heif",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const MIME_ALIASES: Record<string, keyof typeof MIME_EXTENSIONS> = {
  "image/heic-sequence": "image/heic",
  "image/heif-sequence": "image/heif",
  "image/jpg": "image/jpeg",
  "image/pjpeg": "image/jpeg",
  "image/x-png": "image/png",
};

const EXTENSION_MIMES: Record<string, keyof typeof MIME_EXTENSIONS> = {
  avif: "image/avif",
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export type ImageUploadPayload = {
  fileName: string;
  mimeType: string;
  contentBase64: string;
};

export function normalizeFileName(fileName: string) {
  const cleaned = fileName.trim().replace(/[\\/:*?"<>|]/g, "-");
  return (cleaned || "image").slice(0, 255);
}

export function normalizeImageMimeType(mimeType: string, fileName: string) {
  const reported = mimeType.trim().toLowerCase();
  const aliased = MIME_ALIASES[reported] ?? reported;
  if (aliased in MIME_EXTENSIONS) return aliased as keyof typeof MIME_EXTENSIONS;

  const extension = fileName.trim().split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_MIMES[extension];
}

export function extensionForImage(fileName: string, mimeType: string) {
  const nativeExtension = fileName.match(/\.[A-Za-z0-9]{1,10}$/)?.[0]?.toLowerCase();
  return nativeExtension || MIME_EXTENSIONS[mimeType] || ".img";
}

export function decodeImageUpload({ fileName, mimeType, contentBase64 }: ImageUploadPayload) {
  const normalizedMimeType = normalizeImageMimeType(mimeType, fileName);
  if (!normalizedMimeType) {
    throw new Error("يدعم الموقع صور PNG وJPG وWEBP وGIF وAVIF وHEIC وHEIF فقط.");
  }
  if (!contentBase64 || !/^[A-Za-z0-9+/]+={0,2}$/.test(contentBase64)) {
    throw new Error("لم نتمكن من قراءة بيانات الصورة. اختر الملف مرة أخرى.");
  }

  const bytes = Buffer.from(contentBase64, "base64");
  if (bytes.length === 0) throw new Error("ملف الصورة فارغ.");
  if (bytes.length > MAX_IMAGE_BYTES) {
    throw new Error("حجم الصورة أكبر من 8 ميجابايت. اختر ملفًا أصغر.");
  }

  return {
    bytes,
    contentType: normalizedMimeType,
    filename: normalizeFileName(fileName),
    extension: extensionForImage(fileName, normalizedMimeType),
  };
}
