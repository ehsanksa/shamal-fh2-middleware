import { config } from "../config.js";

export async function notifyMarafiqEvent(event: {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  receivedAt: string;
}): Promise<void> {
  if (!config.MARAFIQ_EVENT_CALLBACK_URL) {
    return;
  }

  try {
    await fetch(config.MARAFIQ_EVENT_CALLBACK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(config.MARAFIQ_EVENT_CALLBACK_SECRET
          ? { "X-Shamal-Signature": config.MARAFIQ_EVENT_CALLBACK_SECRET }
          : {}),
      },
      body: JSON.stringify({
        source: "shamal-fh2-middleware",
        event,
      }),
    });
  } catch (err) {
    console.warn("[marafiq-notify] callback failed:", (err as Error).message);
  }
}
