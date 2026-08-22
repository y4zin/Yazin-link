import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { getImageLinkByPublicId } from "../db";
import { storageGetSignedUrl } from "../storage";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.get("/i/:publicId", async (req, res) => {
    try {
      const image = await getImageLinkByPublicId(req.params.publicId);
      if (!image) {
        res.status(404).send("Image not found");
        return;
      }

      const signedUrl = await storageGetSignedUrl(image.storageKey);
      const upstream = await fetch(signedUrl);
      if (!upstream.ok) {
        res.status(502).send("Image service unavailable");
        return;
      }

      const bytes = Buffer.from(await upstream.arrayBuffer());
      res.setHeader("Content-Type", image.contentType);
      res.setHeader("Content-Length", bytes.length);
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      res.status(200).send(bytes);
    } catch (error) {
      console.error("[Image share] Failed to serve shared image:", error);
      res.status(500).send("Could not serve the image");
    }
  });
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
