import { createServer } from "node:http";
import { encryptValue } from "@inco/solana-sdk/encryption";

const host = process.env.INCO_ENCRYPT_HOST || "0.0.0.0";
const port = Number.parseInt(process.env.INCO_ENCRYPT_PORT || "8787", 10);
const maxBodySizeBytes = Number.parseInt(process.env.INCO_ENCRYPT_MAX_BODY_BYTES || "8192", 10);

function writeJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("access-control-allow-methods", "POST, GET, OPTIONS");
  res.setHeader("access-control-allow-headers", "content-type");
  res.end(JSON.stringify(payload));
}

function parseEncryptableValue(value) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    if (!Number.isInteger(value)) {
      throw new Error("value must be an integer when number is used.");
    }

    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) {
      throw new Error("value is required.");
    }

    if (trimmed === "true") {
      return true;
    }

    if (trimmed === "false") {
      return false;
    }

    if (!/^-?\d+$/.test(trimmed)) {
      throw new Error("value string must be an integer or boolean string.");
    }

    return BigInt(trimmed);
  }

  throw new Error("value must be boolean, integer number, or integer string.");
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";

    req.on("data", (chunk) => {
      raw += chunk;

      if (Buffer.byteLength(raw, "utf8") > maxBodySizeBytes) {
        reject(new Error(`Request body too large. Max ${maxBodySizeBytes} bytes.`));
      }
    });

    req.on("end", () => resolve(raw));
    req.on("error", reject);
  });
}

const server = createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    writeJson(res, 204, {});
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    writeJson(res, 200, { ok: true, service: "inco-encrypt" });
    return;
  }

  if (req.method !== "POST" || req.url !== "/encrypt") {
    writeJson(res, 404, { error: "Not found." });
    return;
  }

  try {
    const raw = await readBody(req);
    const body = raw ? JSON.parse(raw) : {};
    const value = parseEncryptableValue(body.value);
    const encryptedHex = await encryptValue(value);

    writeJson(res, 200, { encryptedHex });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Encryption failed.";
    writeJson(res, 400, { error: message });
  }
});

server.listen(port, host, () => {
  // eslint-disable-next-line no-console
  console.log(`[inco-encrypt] listening on http://${host}:${port}`);
});
