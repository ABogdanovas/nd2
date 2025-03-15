import { getDB } from "../config/mongodb";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { ObjectId } from "mongodb";
import { projectSchema } from "../beans/Project";

const getProjects = createRoute({
  method: "get",
  path: "/",

  responses: {
    200: {
      content: {
        "application/json": {
          schema: projectSchema.array(),
        },
      },
      description: "Returns projects",
    },
  },
});

const createProject = createRoute({
  method: "post",
  path: "/",
  request: {
    body: {
      content: {
        "application/json": {
          schema: projectSchema.omit({ _id: true }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            insertedId: z.string(),
            acknowledged: z.boolean(),
          }),
        },
      },
      description: "Creates new user and returns it",
    },
  },
});

const deleteProject = createRoute({
  method: "delete",
  path: "",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            _id: z.string(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            deletedCount: z.number(),
            acknowledged: z.boolean(),
          }),
        },
      },
      description: "Deletes project",
    },
  },
});

const updateProject = createRoute({
  method: "put",
  path: "",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            _id: z.string(),
            name: z.string(),
            description: z.string(),
            ownerId: z.string(),
            participants: z.array(z.string()).nullable(),
            deadline: z.string(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            modifiedCount: z.number(),
            acknowledged: z.boolean(),
          }),
        },
      },
      description: "Updates user",
    },
  },
});

export const createProjectModule = () => {
  const app = new OpenAPIHono();

  return app
    .openapi(getProjects, async (c) => {
      const db = getDB();

      const projects = await db.collection("projects").find().toArray();

      const validatedProjects = projectSchema.array().safeParse(projects);

      if (!validatedProjects.success) {
        throw new Error("Failed to validate users");
      }

      return c.json(validatedProjects.data);
    })
    .openapi(createProject, async (c) => {
      const db = getDB();
      const body = c.req.valid("json");

      const result = await db.collection("projects").insertOne(body);
      return c.json(result);
    })
    .openapi(deleteProject, async (c) => {
      const db = getDB();
      const body = c.req.valid("json");

      const result = await db
        .collection("projects")
        .deleteOne({ _id: new ObjectId(body._id) });
      return c.json(result);
    })
    .openapi(updateProject, async (c) => {
      const db = getDB();
      const body = c.req.valid("json");

      const updateSchema = z
        .object({
          _id: z.string(),
          name: z.string(),
          description: z.string(),
          ownerId: z.string(),
          participants: z.array(z.string()).nullable(),
          deadline: z.string(),
        })
        .partial();
      const validatedUpdateData = updateSchema.parse(body);

      if ("_id" in validatedUpdateData) {
        delete validatedUpdateData._id;
      }

      const filteredUpdateData = Object.fromEntries(
        Object.entries(validatedUpdateData).filter(
          ([, value]) => value !== "" && value !== null
        )
      ) as Partial<typeof validatedUpdateData>;

      const result = await db
        .collection("projects")
        .updateOne(
          { _id: new ObjectId(body._id) },
          { $set: filteredUpdateData }
        );

      return c.json({
        acknowledged: result.acknowledged,
        modifiedCount: result.modifiedCount,
      });
    });
};
