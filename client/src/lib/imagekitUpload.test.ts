import { afterEach, describe, expect, it, vi } from "vitest";
import { uploadToImageKit } from "./imagekitUpload";

describe("uploadToImageKit", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("requests a server signature before sending a public image upload", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ publicKey: "public_test", signature: "signature", token: "token", expire: 1_800_000_000 }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ fileId: "file_123", name: "image.jpg", size: 42, url: "https://ik.imagekit.io/yazinlink/yazin-link/uploads/image.jpg" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await uploadToImageKit({ contentBase64: "aGVsbG8=", fileName: "sample.jpg", mimeType: "image/jpeg" });

    expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/imagekit-auth");
    expect(fetchMock).toHaveBeenNthCalledWith(2, "https://upload.imagekit.io/api/v1/files/upload", expect.objectContaining({ method: "POST" }));
    expect(result.url).toContain("ik.imagekit.io/yazinlink");
  });
});
