// Basic Onfido vendor integration placeholder
import fetch from "node-fetch";

const ONFIDO_TOKEN = process.env.ONFIDO_TOKEN || "";

export async function startLiveness(userId: string) {
  if (!ONFIDO_TOKEN) {
    // Simulate a session when not configured
    return { sessionId: `sim-${userId}-${Date.now()}`, url: "https://example.com/onfido-sim" };
  }
  // Implement real Onfido session creation here
  return { sessionId: `onf-${userId}-${Date.now()}`, url: "https://onfido.com/session" };
}

export async function verifyLiveness(sessionId: string) {
  if (!ONFIDO_TOKEN) {
    return { status: "verified", riskScore: 0.05 };
  }
  // Implement real verification call
  return { status: "verified", riskScore: 0.05 };
}

export async function getStatus(sessionId: string) {
  if (!ONFIDO_TOKEN) {
    return { status: "pending" };
  }
  return { status: "pending" };
}



