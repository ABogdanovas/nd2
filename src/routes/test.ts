import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { snowFlakeConnection } from "../config/snowflake";
import * as fs from "fs";
import * as path from "path";

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const parseLog = createRoute({
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

export const createLogModule = () => {
  const app = new OpenAPIHono();

  return app.post("/", async (c) => {
    try {
      const formData = await c.req.formData();
      const file = formData.get("file");
      if (!file) {
        throw new Error("No file uploaded");
      }
      const arr = await file.arrayBuffer();

      fs.writeFile("./files/logs.txt", Buffer.from(arr), (err) => {
        if (err) {
          console.error("Error writing file:", err);
        } else {
          console.log("File successfully written");
        }
      });

      const absolutePath =
        "file://" + path.join(__dirname, "../../files/logs.txt");

      console.log(absolutePath);

      snowFlakeConnection.execute({
        sqlText: "use database nd2;",
        complete: (err) => {
          if (err) {
            console.error("Error switching database:", err);
          }
        },
      });

      snowFlakeConnection.execute({
        sqlText: "use schema public;",
        complete: (err, stmt, rows) => {
          if (err) {
            console.error("Error switching schema:", err);
          }
        },
      });

      snowFlakeConnection.execute({
        sqlText: `put ${absolutePath} @log_stage overwrite=true;`,
        binds: [absolutePath],
        complete: (err, stmt, rows) => {
          console.log(stmt.getSqlText());
          if (err) {
            console.error("Error putting file:", err);
          }
        },
      });

      const res = await new Promise((resolve, reject) => {
        snowFlakeConnection.execute({
          sqlText: `CALL process_log_file();`,
          complete: (err, stmt, rows) => {
            if (err) {
              reject(err);
            }

            resolve(rows[0].PROCESS_LOG_FILE);
          },
        });
      });

      const arrayRes = [...res];

      return c.json(arrayRes);
    } catch (error) {
      console.error("Error in /upload route:", error);
      c.status(500);
      return c.text("Internal Server Error");
    }
  });
};
