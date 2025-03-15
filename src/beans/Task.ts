import { ObjectId } from "mongodb";
import { z } from "zod";

export const taskSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  title: z.string(),
  description: z.string(),
  projectId: z.string(),
  assignedTo: z.string(),
  status: z.enum(["todo", "in-progress", "done"]),
  priority: z.enum(["low", "medium", "high"]),
  deadline: z.string(),
});

export type Task = z.infer<typeof taskSchema>;
