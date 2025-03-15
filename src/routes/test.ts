import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { snowFlakeConnection } from "../config/snowflake";
import fs from "fs";

const getTasks = createRoute({
  method: "post",
  path: "/",
  responses: {
    200: {
      content: {
        "multipart/form-data": {
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
    const formData = await c.req.formData();
    const file = formData.get("file");
    const arr = await file.arrayBuffer();
    console.log(arr);

    fs.writeFile("./files/log.txt", Buffer.from(arr), (err) => {
      if (err) {
        console.error("Error writing file");
      } else {
        console.log("file success");
      }
    });

    const statement = await snowFlakeConnection.execute({
      sqlText: "SELECT * FROM ND2.PUBLIC.raw_logs;",
      complete: (err, stmt, rows) => {
        console.log(rows);
      },
    });

    c.header("Content-Type", "text/plain");
    return c.body(arr);
  });
};
