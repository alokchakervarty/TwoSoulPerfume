import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    {
      name: "upload-image-middleware",
      configureServer(server) {
        server.middlewares.use("/api/upload-image", async (req, res, next) => {
          if (req.method !== "POST") return next();

          let body = "";
          req.on("data", (chunk) => {
            body += chunk.toString();
          });

          req.on("end", async () => {
            try {
              const payload = JSON.parse(body || "{}");
              const dataUrl = payload?.dataUrl;
              const fileName = payload?.fileName || "product-image";

              if (!dataUrl || typeof dataUrl !== "string") {
                throw new Error("No image data received.");
              }

              const match = dataUrl.match(/^data:(image\/([a-zA-Z0-9.+-]+));base64,(.+)$/);
              if (!match) {
                throw new Error("Unsupported image format.");
              }

              const extension = match[2] || "png";
              const safeName = fileName.replace(/[^a-zA-Z0-9.-]+/g, "-").replace(/-+/g, "-");
              const targetName = `${Date.now()}-${safeName || "image"}.${extension}`;
              const targetPath = path.join(__dirname, "public", "images", "products", targetName);

              await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
              await fs.promises.writeFile(targetPath, Buffer.from(match[3], "base64"));

              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ url: `/images/products/${targetName}` }));
            } catch (error) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ message: error.message }));
            }
          });
        });
      },
    },
  ],
  server: {
    port: 5173,
    host: "0.0.0.0",
  },
});
