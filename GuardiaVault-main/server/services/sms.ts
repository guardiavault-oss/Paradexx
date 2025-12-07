import fetch from "node-fetch";

function getTwilioCreds() {
  const sid = process.env.TWILIO_ACCOUNT_SID || "";
  const token = process.env.TWILIO_AUTH_TOKEN || "";
  const from = process.env.TWILIO_FROM || "";
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID || "";
  if (!sid || !token || (!from && !messagingServiceSid)) return null;
  return { sid, token, from, messagingServiceSid };
}

export async function sendSms(to: string, body: string) {
  const creds = getTwilioCreds();
  if (!creds) return { ok: true, simulated: true };

  const url = `https://api.twilio.com/2010-04-01/Accounts/${creds.sid}/Messages.json`;
  const auth = Buffer.from(`${creds.sid}:${creds.token}`).toString("base64");
  const params = new URLSearchParams({ To: to, Body: body });
  if (creds.messagingServiceSid) {
    params.set("MessagingServiceSid", creds.messagingServiceSid);
  } else if (creds.from) {
    params.set("From", creds.from);
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    return { ok: false, message: text };
  }
  const json = await res.json() as { sid?: string };
  return { ok: true, sid: json.sid };
}


