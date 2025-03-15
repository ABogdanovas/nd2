import { z } from "zod";
import { ObjectId } from "mongodb";

export const userSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(["frontend", "backend", "fullstack"]),
});

export type User = z.infer<typeof userSchema>;
