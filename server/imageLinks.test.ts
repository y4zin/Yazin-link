import { describe, expect, it } from "vitest";
import { decodeImageUpload, extensionForImage, MAX_IMAGE_BYTES, normalizeFileName } from "./imageLinks";

describe("image upload validation", () => {
  it("accepts a supported image payload and preserves its metadata", () => {
    const result = decodeImageUpload({
      fileName: "summer-photo.png",
      mimeType: "image/png",
      contentBase64: Buffer.from("sample-image").toString("base64"),
    });

    expect(result.filename).toBe("summer-photo.png");
    expect(result.extension).toBe(".png");
    expect(result.bytes.toString()).toBe("sample-image");
  });

  it("rejects unsupported file types", () => {
    expect(() =>
      decodeImageUpload({
        fileName: "not-an-image.pdf",
        mimeType: "application/pdf",
        contentBase64: Buffer.from("document").toString("base64"),
      }),
    ).toThrow("PNG");
  });

  it("rejects payloads larger than the configured image limit", () => {
    expect(() =>
      decodeImageUpload({
        fileName: "large.jpg",
        mimeType: "image/jpeg",
        contentBase64: Buffer.alloc(MAX_IMAGE_BYTES + 1, 1).toString("base64"),
      }),
    ).toThrow("8 ميجابايت");
  });

  it("uses safe file names and sensible image extensions", () => {
    expect(normalizeFileName('untitled: "image"?.png')).toBe("untitled- -image--.png");
    expect(extensionForImage("photo", "image/webp")).toBe(".webp");
  });
});
