import { z } from 'zod';

import { SavedObjectType } from '../services/saved-objects';

export const ODSavedObjectUsageEntitySchema = z
  .object({
    lastUsedAt: z.string(),
    savedObjectId: z.string(),
    savedObjectType: z.nativeEnum(SavedObjectType),
  })
  .strip();

export const ODSavedObjectUsageEntityId = z
  .object({
    savedObjectId: z.string(),
    savedObjectType: z.nativeEnum(SavedObjectType),
  })
  .strict()
  .transform((v) => `${v.savedObjectType}:${v.savedObjectId}`);
