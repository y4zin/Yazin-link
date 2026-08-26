export type ImageKitUploadResult = {
  fileId: string;
  name: string;
  size: number;
  url: string;
};

type ImageKitUploadAuth = {
  expire: number;
  publicKey: string;
  signature: string;
  token: string;
};

type ImageKitUploadInput = {
  contentBase64: string;
  fileName: string;
  mimeType: string;
  folder?: string;
  resourceName?: string;
};

function imageKitAuthUrl() {
  return import.meta.env.VITE_IMAGEKIT_AUTH_URL || "/api/imagekit-auth";
}

function fileExtension(fileName: string, mimeType: string) {
  const fromName = fileName.match(/\.[a-z0-9]{1,10}$/i)?.[0]?.toLowerCase();
  if (fromName) return fromName;
  const fromMime: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/avif": ".avif",
    "image/heic": ".heic",
    "image/heif": ".heif",
    "application/pdf": ".pdf",
    "application/zip": ".zip",
    "text/plain": ".txt",
  };
  return fromMime[mimeType] || ".bin";
}

export async function uploadToImageKit(input: ImageKitUploadInput) {
  const resourceName = input.resourceName || "الملف";
  const authResponse = await fetch(imageKitAuthUrl());
  if (!authResponse.ok) throw new Error("تعذر الحصول على تفويض آمن للرفع. حاول مرة أخرى.");
  const auth = (await authResponse.json()) as ImageKitUploadAuth;

  const uploadData = new FormData();
  uploadData.append("file", input.contentBase64);
  uploadData.append("fileName", `yazin-link-${Date.now()}${fileExtension(input.fileName, input.mimeType)}`);
  uploadData.append("folder", input.folder || "/yazin-link/uploads");
  uploadData.append("useUniqueFileName", "true");
  uploadData.append("publicKey", auth.publicKey);
  uploadData.append("signature", auth.signature);
  uploadData.append("expire", String(auth.expire));
  uploadData.append("token", auth.token);

  const uploadResponse = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
    method: "POST",
    body: uploadData,
  });
  if (!uploadResponse.ok) {
    const failure = (await uploadResponse.json().catch(() => null)) as { message?: string } | null;
    throw new Error(failure?.message || `تعذر رفع ${resourceName}. حاول مرة أخرى.`);
  }

  const result = (await uploadResponse.json()) as ImageKitUploadResult;
  if (!result.url || !result.fileId) throw new Error(`لم نحصل على رابط ${resourceName} بعد الرفع.`);
  return result;
}
