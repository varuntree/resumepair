import { z } from "zod";

export const idSchema = z
  .string()
  .min(1)
  .default("")
  .describe("Unique identifier for the item");
