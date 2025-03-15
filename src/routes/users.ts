import { getDB } from "../config/mongodb";
import { userSchema } from "../beans/User";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { ObjectId } from "mongodb";

const getUsers = createRoute({
  method: "get",
  path: "/",

  responses: {
    200: {
      content: {
        "application/json": {
          schema: userSchema.array(),
        },
      },
      description: "Returns users",
    },
  },
});

const createUser = createRoute({
  method: "post",
  path: "/",
  request: {
    body: {
      content: {
        "application/json": {
          schema: userSchema.omit({ _id: true }),
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

const deleteUser = createRoute({
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
      description: "Deletes user",
    },
  },
});

const updateUser = createRoute({
  method: "put",
  path: "",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            _id: z.string(),
            name: z.string().nullable(),
            email: z.string().email().nullable(),
            role: z.enum(["frontend", "backend", "fullstack"]),
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

export const createUserModule = () => {
  const app = new OpenAPIHono();

  return app
    .openapi(getUsers, async (c) => {
      const db = getDB();
      const users = await db.collection("users").find().toArray();

      const validatedUsers = userSchema.array().safeParse(users);

      if (!validatedUsers.success) {
        throw new Error("Failed to validate users");
      }

      return c.json(validatedUsers.data);
    })
    .openapi(createUser, async (c) => {
      const db = getDB();

      const body = c.req.valid("json");

      const result = await db.collection("users").insertOne(body);

      return c.json({
        insertedId: result.insertedId,
        acknowledged: result.acknowledged,
      });
    })
    .openapi(deleteUser, async (c) => {
      const db = getDB();

      const body = c.req.valid("json");
      const result = await db
        .collection("users")
        .deleteOne({ _id: new ObjectId(body._id) });

      return c.json({
        acknowledged: result.acknowledged,
        deletedCount: result.deletedCount,
      });
    })
    .openapi(updateUser, async (c) => {
      const db = getDB();
      const body = c.req.valid("json");

      const updateSchema = z
        .object({
          _id: z.string(),
          name: z.string().nullable(),
          email: z.string().email().nullable(),
          role: z.string().nullable(),
        })
        .partial();
      const validatedUpdateData = updateSchema.parse(body);

      if ("_id" in validatedUpdateData) {
        delete validatedUpdateData._id;
      }

      const filteredUpdateData: Partial<typeof validatedUpdateData> = {};
      for (const key in validatedUpdateData) {
        const typedKey = key as keyof typeof validatedUpdateData;
        const value = validatedUpdateData[typedKey];
        if (value !== "" && value !== null) {
          filteredUpdateData[typedKey] = value;
        }
      }
      const result = await db
        .collection("users")
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
