const MIME_EXTENSIONS: Record<string, string> = {
  "image/avif": ".avif",
  "image/gif": ".gif",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
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

export function extensionForImage(fileName: string, mimeType: string) {
  const nativeExtension = fileName.match(/\.[A-Za-z0-9]{1,10}$/)?.[0]?.toLowerCase();
  return nativeExtension || MIME_EXTENSIONS[mimeType] || ".img";
}

export function decodeImageUpload({ fileName, mimeType, contentBase64 }: ImageUploadPayload) {
  if (!MIME_EXTENSIONS[mimeType]) {
    throw new Error("يدعم LinkForge ملفات PNG وJPG وWEBP وGIF وAVIF فقط.");
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
    filename: normalizeFileName(fileName),
    extension: extensionForImage(fileName, mimeType),
  };
}
