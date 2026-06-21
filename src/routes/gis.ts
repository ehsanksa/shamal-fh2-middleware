import type { FastifyPluginAsync } from "fastify";
import { createFh2Client } from "../fh2/client.js";
import { trajectoryToGeoJson, trajectoryToKml } from "../services/gis.js";
import { normalizeTrajectory } from "../services/normalize.js";

export const gisRoutes: FastifyPluginAsync = async (app) => {
  const fh2 = createFh2Client();

  const loadTrajectory = async (taskId: string) => {
    const trajectory = await fh2.getTaskTrajectory(taskId);
    return normalizeTrajectory(taskId, trajectory);
  };

  app.get<{ Params: { id: string } }>(
    "/v1/marafiq/tasks/:id/trajectory.geojson",
    {
      schema: {
        summary: "Flight path as GeoJSON",
        description: "Use task id from GET /v1/marafiq/tasks. Import into CAFM/GIS layers.",
        tags: ["GIS"],
      },
    },
    async (request, reply) => {
      const trajectory = await loadTrajectory(request.params.id);
      return reply
        .header("Content-Type", "application/geo+json")
        .send(trajectoryToGeoJson(trajectory));
    },
  );

  app.get<{ Params: { id: string } }>(
    "/v1/marafiq/tasks/:id/trajectory.kml",
    {
      schema: {
        summary: "Flight path as KML",
        tags: ["GIS"],
      },
    },
    async (request, reply) => {
      const trajectory = await loadTrajectory(request.params.id);
      return reply
        .header("Content-Type", "application/vnd.google-earth.kml+xml")
        .send(trajectoryToKml(trajectory));
    },
  );
};
