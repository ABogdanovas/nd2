import { getDB } from "../config/mongodb";
import { commentSchema } from "../beans/Comment";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { ObjectId } from "mongodb";

const getComments = createRoute({
  method: "get",
  path: "/",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: commentSchema.array(),
        },
      },
      description: "Returns comments",
    },
  },
});

const getCommentById = createRoute({
  method: "get",
  path: "/:id",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: commentSchema,
        },
      },
      description: "Returns a comment by ID",
    },
  },
});

const createComment = createRoute({
  method: "post",
  path: "/",
  request: {
    body: {
      content: {
        "application/json": {
          schema: commentSchema.omit({ _id: true, createdAt: true }),
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
      description: "Creates new comment and returns the result",
    },
  },
});

const updateComment = createRoute({
  method: "put",
  path: "",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            _id: z.string(),
            taskId: z.string().nullable(),
            authorId: z.string().nullable(),
            content: z.string().nullable(),
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
      description: "Updates comment",
    },
  },
});

const deleteComment = createRoute({
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
      description: "Deletes comment",
    },
  },
});

export const createCommentModule = () => {
  const app = new OpenAPIHono();

  return app
    .openapi(getComments, async (c) => {
      const db = getDB();
      const comments = await db.collection("comments").find().toArray();

      const validatedComments = commentSchema.array().safeParse(comments);
      if (!validatedComments.success) {
        throw new Error("Failed to validate comments");
      }
      return c.json(validatedComments.data);
    })
    .openapi(createComment, async (c) => {
      const db = getDB();
      const body = c.req.valid("json");

      const commentData = { ...body, createdAt: new Date().toISOString() };
      const result = await db.collection("comments").insertOne(commentData);
      return c.json({
        insertedId: result.insertedId,
        acknowledged: result.acknowledged,
      });
    })
    .openapi(deleteComment, async (c) => {
      const db = getDB();
      const body = c.req.valid("json");
      const result = await db
        .collection("comments")
        .deleteOne({ _id: new ObjectId(body._id) });
      return c.json({
        acknowledged: result.acknowledged,
        deletedCount: result.deletedCount,
      });
    })
    .openapi(updateComment, async (c) => {
      const db = getDB();
      const body = c.req.valid("json");

      const updateSchema = z
        .object({
          _id: z.string(),
          taskId: z.string().nullable(),
          authorId: z.string().nullable(),
          content: z.string().nullable(),
        })
        .partial();
      const validatedUpdateData = updateSchema.parse(body);

      if ("_id" in validatedUpdateData) {
        delete validatedUpdateData._id;
      }

      const filteredUpdateData = Object.fromEntries(
        Object.entries(validatedUpdateData).filter(
          ([_, value]) => value !== "" && value !== null
        )
      ) as Partial<typeof validatedUpdateData>;

      const result = await db
        .collection("comments")
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
