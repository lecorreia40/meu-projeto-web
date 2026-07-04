/**
 * Document storage abstraction.
 *
 * Local driver writes under STORAGE_DIR for development. Production should
 * swap in an S3-compatible driver (same interface) with server-side
 * encryption and short-lived signed URLs. Documents are NEVER served from a
 * public URL - downloads go through the audited /api/documents/[id]/download
 * route which checks permissions and writes an AuditLog row.
 */
import "server-only";
import { mkdir, readFile, writeFile } from "fs/promises";
import { createHash, randomUUID } from "crypto";
import path from "path";

const STORAGE_DIR = process.env.STORAGE_DIR ?? "./storage";

export type StoredFile = {
  key: string;
  hash: string;
  size: number;
};

export async function storeFile(buffer: Buffer, filename: string): Promise<StoredFile> {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `${new Date().toISOString().slice(0, 10)}/${randomUUID()}-${safeName}`;
  const fullPath = path.join(STORAGE_DIR, key);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, buffer);
  const hash = createHash("sha256").update(buffer).digest("hex");
  return { key, hash, size: buffer.length };
}

export async function retrieveFile(key: string): Promise<Buffer> {
  // Prevent path traversal out of the storage root
  const fullPath = path.join(STORAGE_DIR, key);
  const resolved = path.resolve(fullPath);
  if (!resolved.startsWith(path.resolve(STORAGE_DIR))) {
    throw new Error("Invalid storage key");
  }
  return readFile(resolved);
}
