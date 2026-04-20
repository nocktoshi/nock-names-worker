import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = Number(process.env.PORT || 4173);

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
};

function safeJoin(root, reqPath) {
  const stripped = reqPath.split("?")[0].split("#")[0];
  const decoded = decodeURIComponent(stripped);
  const rel = decoded.replace(/^\/+/, "");
  const joined = path.join(root, rel);
  const normalizedRoot = path.resolve(root) + path.sep;
  const normalizedJoined = path.resolve(joined);
  if (!normalizedJoined.startsWith(normalizedRoot)) return null;
  return normalizedJoined;
}

const server = http.createServer((req, res) => {
  const root = __dirname;
  const reqUrl = req.url || "/";
  const filePath = safeJoin(root, reqUrl === "/" ? "/index.html" : reqUrl);
  if (!filePath) {
    res.statusCode = 400;
    res.end("Bad Request");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.statusCode = 404;
      res.end("Not Found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.setHeader("Content-Type", mime[ext] || "application/octet-stream");
    res.end(data);
  });
});

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API docs: http://localhost:${port}`);
});


