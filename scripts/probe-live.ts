import dotenv from "dotenv";
dotenv.config();

const token = process.env.FH2_ORG_TOKEN!;
const proj = process.env.FH2_PROJECT_UUID!;
const base = process.env.FH2_BASE_URL!;

async function start(sn: string, cam: string) {
  const res = await fetch(`${base}/openapi/v0.1/live-stream/start`, {
    method: "POST",
    headers: {
      "X-User-Token": token,
      "X-Project-Uuid": proj,
      "X-Language": "en",
      "Content-Type": "application/json",
      "X-Request-Id": crypto.randomUUID(),
    },
    body: JSON.stringify({
      sn,
      camera_index: cam,
      video_expire: 7200,
      video_quality: "adaptive",
      quality_type: "adaptive",
    }),
  });
  const b = (await res.json()) as {
    code?: number;
    message?: string;
    data?: { url?: string; url_type?: string };
  };
  console.log(sn, cam, res.status, b.code, b.message?.slice(0, 80), b.data?.url?.slice(0, 100));
}

async function state(sn: string) {
  const res = await fetch(`${base}/openapi/v0.1/device/${encodeURIComponent(sn)}/state`, {
    headers: {
      "X-User-Token": token,
      "X-Project-Uuid": proj,
      "X-Language": "en",
      "X-Request-Id": crypto.randomUUID(),
    },
  });
  const b = (await res.json()) as { code?: number; message?: string; data?: Record<string, unknown> };
  const ds = (b.data?.device_state ?? b.data) as Record<string, unknown> | undefined;
  console.log(
    "state",
    sn,
    res.status,
    b.code,
    "lat",
    ds?.latitude,
    "lng",
    ds?.longitude,
    "bat",
    (ds?.battery as { capacity_percent?: number } | undefined)?.capacity_percent,
  );
}

await start("1581F8HGX254W00A0CHR", "99-0-0");
await start("8UUXN6300A09XS", "165-0-7");
await state("1581F8HGX254W00A0CHR");
