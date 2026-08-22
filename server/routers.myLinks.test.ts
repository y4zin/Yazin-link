import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  createImageLink: vi.fn(),
  claimImageLinkForOwner: vi.fn(),
  deleteImageLinkForOwner: vi.fn(),
  getImageLinkByPublicId: vi.fn(),
  listImageLinksByOwner: vi.fn(),
}));

vi.mock("./db", () => dbMocks);
vi.mock("./storage", () => ({ storagePut: vi.fn() }));

import { appRouter } from "./routers";

function ownerContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "owner-123",
      email: "owner@example.com",
      name: "Owner",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {}, get: () => "example.test" } as unknown as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("imageLink ownership", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists only the current account's saved links", async () => {
    const records = [{ publicId: "image-123", filename: "sample.jpg" }];
    dbMocks.listImageLinksByOwner.mockResolvedValue(records);

    const caller = appRouter.createCaller(ownerContext());
    await expect(caller.imageLink.listMine()).resolves.toEqual(records);
    expect(dbMocks.listImageLinksByOwner).toHaveBeenCalledWith("owner-123");
  });

  it("deletes a link only through the current account ownership key", async () => {
    dbMocks.deleteImageLinkForOwner.mockResolvedValue(1);

    const caller = appRouter.createCaller(ownerContext());
    await expect(caller.imageLink.removeMine({ publicId: "image-123" })).resolves.toEqual({ success: true });
    expect(dbMocks.deleteImageLinkForOwner).toHaveBeenCalledWith("image-123", "owner-123");
  });

  it("does not report success when the link is not owned by the current account", async () => {
    dbMocks.deleteImageLinkForOwner.mockResolvedValue(0);

    const caller = appRouter.createCaller(ownerContext());
    await expect(caller.imageLink.removeMine({ publicId: "image-123" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("claims a previously unassigned link for the current account", async () => {
    dbMocks.claimImageLinkForOwner.mockResolvedValue(1);

    const caller = appRouter.createCaller(ownerContext());
    await expect(caller.imageLink.claimMine({ publicId: "legacy-123" })).resolves.toEqual({ success: true });
    expect(dbMocks.claimImageLinkForOwner).toHaveBeenCalledWith("legacy-123", "owner-123");
  });
});
