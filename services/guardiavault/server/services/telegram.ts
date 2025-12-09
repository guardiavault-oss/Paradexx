import fetch from "node-fetch";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

export async function sendTelegramMessage(usernameOrChatId: string, text: string) {
  if (!TELEGRAM_BOT_TOKEN) {
    return { ok: true, simulated: true };
  }
  const chatId = usernameOrChatId.startsWith("@") ? usernameOrChatId : usernameOrChatId;
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text })
  });
  return res.json();
}

export async function setWebhook(webhookUrl: string) {
  if (!TELEGRAM_BOT_TOKEN) return { ok: true, simulated: true };
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: webhookUrl })
  });
  return res.json();
}



