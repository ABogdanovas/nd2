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
    const statement = snowFlakeConnection.execute({
      sqlText: "SELECT * FROM ND2.PUBLIC.row_logs",
    });

    const rows = [];

    // Wrap fetchRows in a Promise
    await new Promise((resolve, reject) => {
      statement.fetchRows({
        numRows: 10, // Use the correct property if available
        each: (row) => rows.push(row),
        end: () => resolve(),
        error: (err) => reject(err),
      });
    });

    console.log(rows);

    return c.json({ message: "Hello World" });
  });
};
