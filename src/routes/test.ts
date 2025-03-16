import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { snowFlakeConnection } from "../config/snowflake";
import { writeFile } from "fs";

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

    writeFile("./files/log.txt", Buffer.from(arr), (err) => {
      if (err) {
        console.error("Error writing file");
      } else {
        console.log("file success");
      }
    });

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
