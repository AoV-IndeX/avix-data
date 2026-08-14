import { z } from "zod";

export const SheetManifestSchema = z
  .object({
    key: z.string().min(1, "Key must not be empty."),
    gid: z.string().min(1, "GID must not be empty."),

    headers: z.preprocess((val) => {
      if (typeof val === "string") {
        return val
          .split("|")
          .map((header) => header.trim())
          .filter(Boolean);
      }

      return val;
    }, z.array(z.string())),

    enabled: z.preprocess((val) => {
      if (typeof val === "string") {
        return val.toLowerCase() === "true";
      }

      if (typeof val === "boolean") {
        return val;
      }

      return false;
    }, z.boolean()),
  })
  .refine((manifest) => !manifest.enabled || manifest.headers.length > 0, {
    message: "Enabled tables must define at least one header.",
    path: ["headers"],
  });
