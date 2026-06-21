import dotenv from "dotenv";
dotenv.config();

const token = process.env.FH2_ORG_TOKEN!;
const proj = process.env.FH2_PROJECT_UUID!;
const base = process.env.FH2_BASE_URL!;
const sn = process.argv[2] ?? "1581F8HGX254W00A0CHR";

async function probe(path: string, projectScoped = true) {
  const headers: Record<string, string> = {
    "X-User-Token": token,
    "X-Language": "en",
    Accept: "application/json",
    "X-Request-Id": crypto.randomUUID(),
  };
  if (projectScoped && proj) headers["X-Project-Uuid"] = proj;
  const res = await fetch(`${base}${path}`, { headers });
  const body = (await res.json()) as { code?: number; message?: string; data?: unknown };
  console.log(res.status, path, body.code, (body.message ?? "").slice(0, 100));
  if (body.code === 0 && body.data) {
    console.log(JSON.stringify(body.data).slice(0, 300));
  }
}

const paths = [
  [`/openapi/v0.1/device/${sn}/state`, true],
  [`/openapi/v0.1/device/${sn}/state`, false],
  [`/openapi/v0.1/device`, false],
  [`/openapi/v0.1/device/hms?device_sn_list=${sn}`, true],
] as const;

for (const [path, scoped] of paths) {
  await probe(path, scoped);
}
