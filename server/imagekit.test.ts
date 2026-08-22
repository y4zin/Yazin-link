import { describe, expect, it } from "vitest";
import { createImageKitUploadAuth } from "./imagekit";

describe("createImageKitUploadAuth", () => {
  it("creates a short-lived signature without exposing the private key", () => {
    const auth = createImageKitUploadAuth();

    expect(auth.publicKey).toBe(process.env.IMAGEKIT_PUBLIC_KEY);
    expect(auth.expire).toBeGreaterThan(Math.floor(Date.now() / 1000));
    expect(auth.token).toHaveLength(36);
    expect(auth.signature).toMatch(/^[a-f0-9]{40}$/);
    expect(JSON.stringify(auth)).not.toContain(process.env.IMAGEKIT_PRIVATE_KEY!);
  });
});
