import { ObjectId } from "mongodb";
import { z } from "zod";

export const projectSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  name: z.string(),
  description: z.string(),
  ownerId: z.string(),
  participants: z.array(z.string()),
  deadline: z.string(),
});

export type Project = z.infer<typeof projectSchema>;
