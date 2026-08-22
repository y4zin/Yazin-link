import { describe, expect, it } from "vitest";

describe("ImageKit credentials", () => {
  it("authenticates against the ImageKit files API", async () => {
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    const endpoint = process.env.IMAGEKIT_URL_ENDPOINT;

    expect(privateKey, "IMAGEKIT_PRIVATE_KEY must be configured").toBeTruthy();
    expect(endpoint, "IMAGEKIT_URL_ENDPOINT must be configured").toMatch(/^https:\/\/ik\.imagekit\.io\//);

    const authorization = `Basic ${Buffer.from(`${privateKey}:`).toString("base64")}`;
    const response = await fetch("https://api.imagekit.io/v1/files?limit=1", {
      headers: { Authorization: authorization },
    });

    expect(response.status, `ImageKit rejected the configured credentials (${response.status})`).toBe(200);
  }, 15_000);
});
