/**
 * Cloudflare Worker template for the GitHub Pages build of Yazin-link.
 * Set IMAGEKIT_PRIVATE_KEY, IMAGEKIT_PUBLIC_KEY, and ALLOWED_ORIGIN as Worker secrets.
 * The private key never reaches the browser or the public GitHub repository.
 */
const encoder = new TextEncoder();

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin");
  const allowedOrigin = env.ALLOWED_ORIGIN || "https://y4zin.github.io";
  return origin === allowedOrigin
    ? { "Access-Control-Allow-Origin": allowedOrigin, "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", Vary: "Origin" }
    : {};
}

async function hmacSha1(value, secret) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const bytes = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
  return [...bytes].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

export default {
  async fetch(request, env) {
    const headers = corsHeaders(request, env);
    if (request.method === "OPTIONS") return new Response(null, { headers });
    if (request.method !== "GET") return new Response("Method not allowed", { status: 405, headers });
    if (!env.IMAGEKIT_PRIVATE_KEY || !env.IMAGEKIT_PUBLIC_KEY) return new Response("Image upload is not configured", { status: 503, headers });

    const token = crypto.randomUUID();
    const expire = Math.floor(Date.now() / 1000) + 10 * 60;
    const signature = await hmacSha1(`${token}${expire}`, env.IMAGEKIT_PRIVATE_KEY);
    return Response.json({ token, expire, signature, publicKey: env.IMAGEKIT_PUBLIC_KEY }, { headers });
  },
};
