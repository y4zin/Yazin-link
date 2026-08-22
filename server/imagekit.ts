import crypto from "node:crypto";

type ImageKitUploadAuth = {
  expire: number;
  publicKey: string;
  signature: string;
  token: string;
};

export function createImageKitUploadAuth(): ImageKitUploadAuth {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;

  if (!privateKey || !publicKey) {
    throw new Error("Image upload is not configured.");
  }

  const token = crypto.randomUUID();
  const expire = Math.floor(Date.now() / 1000) + 10 * 60;
  const signature = crypto.createHmac("sha1", privateKey).update(`${token}${expire}`).digest("hex");

  return { token, expire, signature, publicKey };
}
