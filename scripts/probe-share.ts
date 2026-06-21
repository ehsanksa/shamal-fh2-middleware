import dotenv from "dotenv";
dotenv.config();

const token = process.env.FH2_ORG_TOKEN!;
const proj = process.env.FH2_PROJECT_UUID!;
const base = process.env.FH2_BASE_URL!;
const drone = "1581F8HGX254W00A0CHR";

async function tryReq(label: string, url: string, init?: RequestInit) {
  const headers: Record<string, string> = {
    "X-User-Token": token,
    "X-Language": "en",
    Accept: "application/json",
    "X-Request-Id": crypto.randomUUID(),
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (!url.includes("/openapi/v0.1/device\n")) headers["X-Project-Uuid"] = proj;
  const res = await fetch(url, { ...init, headers });
  const text = await res.text();
  console.log(label, res.status, text.slice(0, 200));
}

const paths = [
  [`POST v0.1 share`, `${base}/openapi/v0.1/live-stream/share`, { method: "POST", body: JSON.stringify({ drone_sn: drone }) }],
  [`POST v0.1 share-link`, `${base}/openapi/v0.1/live-stream/share-link`, { method: "POST", body: JSON.stringify({ sn: drone }) }],
  [`GET v0.1 share list`, `${base}/openapi/v0.1/live-stream/share`, { method: "GET" }],
  [`POST v0.9 share`, `${base}/openapi/v0.9/manage/api/v1/projects/${proj}/share/live`, { method: "POST", body: JSON.stringify({ drone_sn: drone }) }],
  [`GET project`, `${base}/openapi/v0.1/project/${proj}`, { method: "GET" }],
];

for (const [label, url, init] of paths) {
  await tryReq(label, url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers as object) },
  });
}
