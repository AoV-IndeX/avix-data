import { z } from "zod";

export const SheetManifestSchema = z.object({
  key: z.string().min(1, "Key must not be empty."),
  gid: z.string().min(1, "Gid must not be empty."),
  headers: z.preprocess((val) => {
    if (typeof val === "string") {
      return val
        .split("|")
        .map((h) => h.trim())
        .filter(Boolean);
    }
    return val;
  }, z.array(z.string())),
  enabled: z.preprocess((val) => {
    if (typeof val === "string") {
      const normalized = val.trim().toLowerCase();

      if (normalized === "true") return true;
      if (normalized === "false") return false;
    }
    if (typeof val === "boolean") {
      return val;
    }
    return val;
  }, z.boolean()),
});
