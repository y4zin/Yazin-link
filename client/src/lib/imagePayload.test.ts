import { describe, expect, it, vi } from "vitest";
import { captureImageContents } from "./imagePayload";

describe("captureImageContents", () => {
  it("captures the file bytes immediately and returns portable Base64", async () => {
    const bytes = new Uint8Array([72, 101, 108, 108, 111]);
    const file = {
      arrayBuffer: vi.fn().mockResolvedValue(bytes.buffer),
    };

    await expect(captureImageContents(file)).resolves.toBe("SGVsbG8=");
    expect(file.arrayBuffer).toHaveBeenCalledTimes(1);
  });

  it("rejects empty content before the image can be submitted", async () => {
    await expect(captureImageContents({ arrayBuffer: async () => new ArrayBuffer(0) })).rejects.toThrow("empty");
  });

  it("surfaces a revoked-file read failure so the interface can request a new selection", async () => {
    const revokedFile = {
      arrayBuffer: async () => {
        throw new Error("The requested file could not be read due to permission problems.");
      },
    };

    await expect(captureImageContents(revokedFile)).rejects.toThrow("permission problems");
  });
});
