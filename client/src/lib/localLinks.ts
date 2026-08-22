export type LocalImageLink = {
  bytes: number;
  contentType: string;
  createdAt: string;
  filename: string;
  publicId: string;
  publicUrl: string;
};

type StorageLike = Pick<Storage, "getItem" | "setItem">;

const STORAGE_KEY = "yazin-link.local-image-links.v1";
const MAX_SAVED_LINKS = 100;

function getStorage(storage?: StorageLike) {
  if (storage) return storage;
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export function readLocalLinks(storage?: StorageLike): LocalImageLink[] {
  const target = getStorage(storage);
  if (!target) return [];
  try {
    const parsed = JSON.parse(target.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(link => link && typeof link.publicId === "string" && typeof link.publicUrl === "string");
  } catch {
    return [];
  }
}

export function writeLocalLinks(links: LocalImageLink[], storage?: StorageLike) {
  const target = getStorage(storage);
  if (!target) return;
  target.setItem(STORAGE_KEY, JSON.stringify(links.slice(0, MAX_SAVED_LINKS)));
}

export function saveLocalLink(link: LocalImageLink, storage?: StorageLike) {
  const next = [link, ...readLocalLinks(storage).filter(existing => existing.publicId !== link.publicId)];
  writeLocalLinks(next, storage);
  return next.slice(0, MAX_SAVED_LINKS);
}

export function removeLocalLink(publicId: string, storage?: StorageLike) {
  const next = readLocalLinks(storage).filter(link => link.publicId !== publicId);
  writeLocalLinks(next, storage);
  return next;
}

export function linkFromUrl(url: string): LocalImageLink | null {
  try {
    const parsed = new URL(url.trim());
    const parts = parsed.pathname.split("/").filter(Boolean);
    const publicId = parts.at(-1);
    if (!publicId || publicId.length < 6) return null;
    return { publicId, publicUrl: parsed.toString(), filename: "رابط صورة سابق", bytes: 0, contentType: "image/*", createdAt: new Date().toISOString() };
  } catch {
    return null;
  }
}
