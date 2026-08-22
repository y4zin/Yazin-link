import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { claimImageLinkForOwner, createImageLink, deleteImageLinkForOwner, getImageLinkByPublicId, listImageLinksByOwner } from "./db";
import { decodeImageUpload } from "./imageLinks";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { storagePut } from "./storage";
import { COOKIE_NAME } from "../shared/const";

const imageUploadInput = z.object({
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().max(100),
  contentBase64: z.string().min(4).max(11_200_000),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  imageLink: router({
    upload: publicProcedure.input(imageUploadInput).mutation(async ({ input, ctx }) => {
      const image = decodeImageUpload(input);
      const publicId = nanoid(12);
      const stored = await storagePut(`yazin-link/images/${publicId}${image.extension}`, image.bytes, image.contentType);
      await createImageLink({
        ownerOpenId: ctx.user?.openId ?? null,
        publicId,
        storageKey: stored.key,
        storageUrl: stored.url,
        filename: image.filename,
        contentType: image.contentType,
        bytes: image.bytes.length,
      });
      const host = ctx.req.get("host") ?? "localhost";
      const publicUrl = new URL(`/i/${publicId}`, `${ctx.req.protocol}://${host}`).toString();
      return { publicId, publicUrl, filename: image.filename, bytes: image.bytes.length, contentType: image.contentType };
    }),
    get: publicProcedure.input(z.object({ publicId: z.string().min(6).max(32) })).query(async ({ input }) => {
      const image = await getImageLinkByPublicId(input.publicId);
      if (!image) throw new TRPCError({ code: "NOT_FOUND", message: "رابط الصورة غير موجود." });
      return image;
    }),
    listMine: protectedProcedure.query(({ ctx }) => listImageLinksByOwner(ctx.user.openId)),
    removeMine: protectedProcedure.input(z.object({ publicId: z.string().min(6).max(32) })).mutation(async ({ input, ctx }) => {
      const removed = await deleteImageLinkForOwner(input.publicId, ctx.user.openId);
      if (removed === 0) throw new TRPCError({ code: "NOT_FOUND", message: "لم نجد هذا الرابط داخل حسابك." });
      return { success: true } as const;
    }),
    claimMine: protectedProcedure.input(z.object({ publicId: z.string().min(6).max(32) })).mutation(async ({ input, ctx }) => {
      const claimed = await claimImageLinkForOwner(input.publicId, ctx.user.openId);
      if (claimed === 0) throw new TRPCError({ code: "NOT_FOUND", message: "لا يمكن ربط هذا الرابط بالحساب. تأكد أن الرابط صحيح ولم تتم إضافته سابقًا." });
      return { success: true } as const;
    }),
  }),
});

export type AppRouter = typeof appRouter;
