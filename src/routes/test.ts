import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { snowFlakeConnection } from "../config/snowflake";

const getTasks = createRoute({
  method: "get",
  path: "/",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.any(),
        },
      },
      description: "Returns tasks",
    },
  },
});

export const createTestModule = () => {
  const app = new OpenAPIHono();

  return app.openapi(getTasks, async (c) => {
    const rows = await new Promise((resolve, reject) =>
      snowFlakeConnection.execute({
        sqlText: `SELECT * FROM ND2.PUBLIC.STRUCTURED_LOGS`,
        complete: (err, stmt, _rows) => {
          if (err) {
            err && console.log("error 1", err);
            reject(err);
          }

          resolve(_rows);
        },
      })
    );

    return c.json({ message: "Hello World", rows });
  });
};
