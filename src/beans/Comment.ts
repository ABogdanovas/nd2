import { ObjectId } from "mongodb";
import { z } from "zod";

export const commentSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  taskId: z.string(),
  authorId: z.string(),
  content: z.string(),
  createdAt: z.string(),
});

export type Comment = z.infer<typeof commentSchema>;
