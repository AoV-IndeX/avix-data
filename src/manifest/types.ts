import { z } from "zod";

export const ManifestEntrySchema = z
  .object({
    table: z.string().min(1),
    gid: z.string().nullable(),
    type: z.enum(["main", "extension", "i18n"]),
    primaryKey: z.array(z.string()).min(1),
    parent: z.string().nullable(),
    relations: z.array(z.string()),
    cardinality: z.enum(["one", "many"]).nullable(),
    headers: z.array(z.string()).min(1),
    isEnabled: z.boolean(),
  })
  .superRefine((entry, ctx) => {
    for (const key of entry.primaryKey) {
      if (!entry.headers.includes(key)) {
        ctx.addIssue({
          code: "custom",
          message: `[manifest] Primary key "${key}" is not in headers.`,
          path: ["primaryKey"],
        });
      }
    }

    if (entry.type === "main") {
      if (entry.parent !== null || entry.relations.length > 0) {
        ctx.addIssue({
          code: "custom",
          message: `[manifest] Main table cannot have a parent or relations.`,
          path: ["type"],
        });
      }
    }

    if (entry.type === "extension") {
      if (entry.cardinality === null) {
        ctx.addIssue({
          code: "custom",
          message: "[manifest] Extension table must specify cardinality.",
          path: ["cardinality"],
        });
      }

      if (entry.parent === null) {
        ctx.addIssue({
          code: "custom",
          message: `[manifest] Extension table must have a parent.`,
          path: ["parent"],
        });
      }

      if (entry.relations.length !== 1) {
        ctx.addIssue({
          code: "custom",
          message: `[manifest] Extension table must have exactly one relation.`,
          path: ["relations"],
        });
      }

      for (const relation of entry.relations) {
        if (!entry.headers.includes(relation)) {
          ctx.addIssue({
            code: "custom",
            message: `[manifest] Relation "${relation}" is not in headers.`,
            path: ["relations"],
          });
        }
      }
    } else if (entry.cardinality !== null) {
      ctx.addIssue({
        code: "custom",
        message: `[manifest] Table of type "${entry.type}" must not specify cardinality.`,
        path: ["cardinality"],
      });
    }

    if (entry.type === "i18n") {
      if (entry.primaryKey.length !== 1 || entry.primaryKey[0] !== "key") {
        ctx.addIssue({
          code: "custom",
          message: `[manifest] i18n table must use "key" as primary key.`,
          path: ["primaryKey"],
        });
      }

      if (entry.parent === null) {
        ctx.addIssue({
          code: "custom",
          message: `[manifest] i18n table must have a parent.`,
          path: ["parent"],
        });
      }

      if (entry.relations.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: `[manifest] i18n table must have at least one relation (e.g., nameKey).`,
          path: ["relations"],
        });
      }
    }

    // GID invariant
    if (entry.type !== "i18n" && entry.gid === null) {
      ctx.addIssue({
        code: "custom",
        message: `[manifest] Table of type "${entry.type}" must have a valid GID.`,
        path: ["gid"],
      });
    }
  });

export type ManifestEntry = z.infer<typeof ManifestEntrySchema>;
