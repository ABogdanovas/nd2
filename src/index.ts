import { connectToMongo } from "./config/mongodb.js";
import { createUserModule } from "./routes/users.js";
import { serve } from "@hono/node-server";
import { apiReference } from "@scalar/hono-api-reference";
import { OpenAPIHono } from "@hono/zod-openapi";
import { createProjectModule } from "./routes/project.js";
import { createTaskModule } from "./routes/tasks.js";
import { createCommentModule } from "./routes/comments.js";
import { snowFlakeConnection } from "./config/snowflake.js";
import { createTestModule } from "./routes/test.js";

const app = new OpenAPIHono();

snowFlakeConnection.connectAsync((error, conn) => {
  if (error) {
    console.log("Error connecting to snowflake", error);
  } else {
    console.log("Connected to snowflake");
  }
});

app.doc("/api", {
  info: {
    title: "Documentation for users API",
    version: "v1",
  },
  openapi: "3.1.0",
});

app.route("/test", createTestModule()).get(
  "/",
  apiReference({
    spec: {
      url: "./api",
    },
  })
);

const PORT = 3000;

serve({
  fetch: app.fetch,
  port: PORT,
});
