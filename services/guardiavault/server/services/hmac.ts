import crypto from "crypto";

const DEFAULT_TTL_MS = 15 * 60 * 1000; // 15 minutes

type TokenRecord = { exp: number; used: boolean; guardianId: string; vaultId: string };
const tokenStore = new Map<string, TokenRecord>();

function getSecret(): string {
  const secret = (process.env.NOTIFY_HMAC_SECRET || "").trim();
  if (!secret) {
    // Dev fallback; DO NOT USE IN PROD
    return "dev-secret-change-me";
  }
  return secret;
}

export function createOneTimeToken(params: { guardianId: string; vaultId: string; ttlMs?: number }) {
  const { guardianId, vaultId, ttlMs = DEFAULT_TTL_MS } = params;
  const issuedAt = Date.now();
  const nonce = crypto.randomBytes(16).toString("hex");
  const payload = `${guardianId}.${vaultId}.${issuedAt}.${nonce}`;
  const mac = crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
  const token = Buffer.from(`${payload}.${mac}`).toString("base64url");
  tokenStore.set(token, { exp: issuedAt + ttlMs, used: false, guardianId, vaultId });
  return token;
}

export function verifyAndConsumeToken(token: string) {
  const rec = tokenStore.get(token);
  if (!rec) return { ok: false, reason: "unknown" as const };
  if (rec.used) return { ok: false, reason: "used" as const };
  if (Date.now() > rec.exp) {
    tokenStore.delete(token);
    return { ok: false, reason: "expired" as const };
  }

  // Verify HMAC integrity
  const decoded = Buffer.from(token, "base64url").toString("utf8");
  const [guardianId, vaultId, issuedAt, nonce, mac] = decoded.split(".");
  const payload = `${guardianId}.${vaultId}.${issuedAt}.${nonce}`;
  const expected = crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
  const valid = crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected));
  if (!valid) return { ok: false, reason: "tampered" as const };

  rec.used = true;
  tokenStore.set(token, rec);
  return { ok: true, guardianId: rec.guardianId, vaultId: rec.vaultId } as const;
}


