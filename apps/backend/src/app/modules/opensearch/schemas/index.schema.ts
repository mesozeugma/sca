import { z } from 'zod';

const IndexFieldMappingBase = z
  .object({
    type: z
      .enum(['boolean', 'date', 'flat_object', 'keyword', 'object', 'text'])
      .default('object')
      .optional(),
    dynamic: z
      .enum(['runtime', 'strict', 'true', 'false'])
      .or(z.boolean())
      .optional(),
    copy_to: z.string().array().optional(),
    ignore_above: z.number().int().optional(),
  })
  .strip();

type IndexFieldMapping = z.infer<typeof IndexFieldMappingBase> & {
  properties?: Record<string, IndexFieldMapping>;
  fields?: Record<string, IndexFieldMapping>;
};

export const IndexName = z.string().min(1);

export const IndexFieldName = z.string().min(1);

const IndexFieldMappingProperties = z.lazy(() =>
  z.record(IndexFieldName, IndexMappings).optional()
);

export const IndexMappings: z.ZodType<IndexFieldMapping> =
  IndexFieldMappingBase.extend({
    properties: IndexFieldMappingProperties,
    fields: IndexFieldMappingProperties,
  }).strip();

export const IndexInfo = z.object({ mappings: IndexMappings }).strip();

export const GetIndexInfoResponse = z.record(IndexName, IndexInfo);
