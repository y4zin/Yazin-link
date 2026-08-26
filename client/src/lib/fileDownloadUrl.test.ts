import { describe, expect, it } from "vitest";
import { createFileDownloadUrl } from "./fileDownloadUrl";

describe("createFileDownloadUrl", () => {
  it("keeps the original stored URL and configures an attachment download", () => {
    const url = new URL(createFileDownloadUrl(
      "https://ik.imagekit.io/yazinlink/yazin-link/files/report-123.pdf",
      "تقرير الربع الأول.pdf",
    ));

    expect(`${url.origin}${url.pathname}`).toBe("https://ik.imagekit.io/yazinlink/yazin-link/files/report-123.pdf");
    expect(url.searchParams.get("ik-attachment")).toBe("true");
    expect(url.searchParams.get("ik-attachment-filename")).toBe("تقرير الربع الأول");
  });

  it("does not add an empty suggested filename", () => {
    const url = new URL(createFileDownloadUrl("https://ik.imagekit.io/yazinlink/yazin-link/files/blob.bin", ".bin"));

    expect(url.searchParams.get("ik-attachment")).toBe("true");
    expect(url.searchParams.has("ik-attachment-filename")).toBe(false);
  });
});
