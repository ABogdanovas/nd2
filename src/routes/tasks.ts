import { getDB } from "../config/mongodb";
import { taskSchema } from "../beans/Task";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { ObjectId } from "mongodb";

const getTasks = createRoute({
  method: "get",
  path: "/",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: taskSchema.array(),
        },
      },
      description: "Returns tasks",
    },
  },
});

const createTask = createRoute({
  method: "post",
  path: "/",
  request: {
    body: {
      content: {
        "application/json": {
          schema: taskSchema.omit({ _id: true }),
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
      description: "Creates new task and returns it",
    },
  },
});

const deleteTask = createRoute({
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
      description: "Deletes task",
    },
  },
});

const updateTask = createRoute({
  method: "put",
  path: "",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            _id: z.string(),
            title: z.string().nullable(),
            description: z.string().nullable(),
            projectId: z.string().nullable(),
            assignedTo: z.string().nullable(),
            status: z.enum(["todo", "in-progress", "done"]).nullable(),
            priority: z.enum(["low", "medium", "high"]).nullable(),
            dueDate: z.string().nullable(),
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
      description: "Updates task",
    },
  },
});

export const createTaskModule = () => {
  const app = new OpenAPIHono();

  return app
    .openapi(getTasks, async (c) => {
      const db = getDB();
      const tasks = await db.collection("tasks").find().toArray();

      console.log(tasks);

      const validatedTasks = taskSchema.array().safeParse(tasks);
      if (!validatedTasks.success) {
        throw new Error(
          "Failed to validate tasks:" + validatedTasks.error.toString()
        );
      }
      return c.json(validatedTasks.data);
    })
    .openapi(createTask, async (c) => {
      const db = getDB();
      const body = c.req.valid("json");
      const result = await db.collection("tasks").insertOne(body);
      return c.json({
        insertedId: result.insertedId,
        acknowledged: result.acknowledged,
      });
    })
    .openapi(deleteTask, async (c) => {
      const db = getDB();
      const body = c.req.valid("json");
      const result = await db
        .collection("tasks")
        .deleteOne({ _id: new ObjectId(body._id) });
      return c.json({
        acknowledged: result.acknowledged,
        deletedCount: result.deletedCount,
      });
    })
    .openapi(updateTask, async (c) => {
      const db = getDB();
      const body = c.req.valid("json");

      const updateSchema = z
        .object({
          _id: z.string(),
          title: z.string().nullable(),
          description: z.string().nullable(),
          projectId: z.string().nullable(),
          assignedTo: z.string().nullable(),
          status: z.enum(["todo", "in-progress", "done"]).nullable(),
          priority: z.enum(["low", "medium", "high"]).nullable(),
          dueDate: z.string().nullable(),
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
        .collection("tasks")
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
