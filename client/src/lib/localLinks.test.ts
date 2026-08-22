import { describe, expect, it } from "vitest";
import { linkFromUrl, readLocalLinks, removeLocalLink, renameLocalLink, saveLocalLink, verifyImageUrl } from "./localLinks";

function memoryStorage() {
  const values = new Map<string, string>();
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) };
}

describe("local image links", () => {
  it("saves the latest link and replaces duplicate public IDs", () => {
    const storage = memoryStorage();
    const base = { publicId: "image-123", publicUrl: "https://example.test/i/image-123", filename: "one.jpg", bytes: 10, contentType: "image/jpeg", createdAt: "2026-01-01T00:00:00.000Z" };
    saveLocalLink(base, storage);
    const result = saveLocalLink({ ...base, filename: "updated.jpg" }, storage);
    expect(result).toHaveLength(1);
    expect(readLocalLinks(storage)[0]?.filename).toBe("updated.jpg");
  });

  it("removes only the requested local record", () => {
    const storage = memoryStorage();
    saveLocalLink({ publicId: "image-123", publicUrl: "https://example.test/i/image-123", filename: "one.jpg", bytes: 10, contentType: "image/jpeg", createdAt: "2026-01-01T00:00:00.000Z" }, storage);
    saveLocalLink({ publicId: "image-456", publicUrl: "https://example.test/i/image-456", filename: "two.jpg", bytes: 10, contentType: "image/jpeg", createdAt: "2026-01-01T00:00:00.000Z" }, storage);
    expect(removeLocalLink("image-123", storage).map(link => link.publicId)).toEqual(["image-456"]);
  });

  it("renames a saved link without changing its public URL", () => {
    const storage = memoryStorage();
    saveLocalLink({ publicId: "image-123", publicUrl: "https://example.test/i/image-123", filename: "one.jpg", bytes: 10, contentType: "image/jpeg", createdAt: "2026-01-01T00:00:00.000Z" }, storage);
    const renamed = renameLocalLink("image-123", "صورة الغلاف", storage);
    expect(renamed[0]).toMatchObject({ filename: "صورة الغلاف", publicUrl: "https://example.test/i/image-123" });
  });

  it("extracts a previous direct-image URL for local saving", () => {
    expect(linkFromUrl("https://example.test/i/abc12345")?.publicId).toBe("abc12345");
    expect(linkFromUrl("not a url")).toBeNull();
  });

  it("accepts a URL only when the browser can load an actual image", async () => {
    class SuccessfulImage {
      onerror: (() => void) | null = null;
      onload: (() => void) | null = null;
      naturalWidth = 100;
      set src(_value: string) { queueMicrotask(() => this.onload?.()); }
    }
    const originalImage = globalThis.Image;
    Object.defineProperty(globalThis, "Image", { configurable: true, value: SuccessfulImage });
    await expect(verifyImageUrl("https://example.test/image.jpg")).resolves.toBeUndefined();
    Object.defineProperty(globalThis, "Image", { configurable: true, value: originalImage });
  });

  it("rejects a non-image URL before it can be saved", async () => {
    class BrokenImage {
      onerror: (() => void) | null = null;
      onload: (() => void) | null = null;
      naturalWidth = 0;
      set src(_value: string) { queueMicrotask(() => this.onerror?.()); }
    }
    const originalImage = globalThis.Image;
    Object.defineProperty(globalThis, "Image", { configurable: true, value: BrokenImage });
    await expect(verifyImageUrl("https://example.test/not-an-image")).rejects.toThrow("مباشرة");
    Object.defineProperty(globalThis, "Image", { configurable: true, value: originalImage });
  });
});
