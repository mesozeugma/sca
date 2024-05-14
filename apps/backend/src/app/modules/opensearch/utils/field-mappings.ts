import { z } from 'zod';

import { IndexMappings } from '../schemas/index.schema';

const DEFAULT_KEYWORD_IGNORE_ABOVE = 256;

export class FieldMappings {
  static boolean(): z.infer<typeof IndexMappings> {
    return {
      type: 'boolean',
    };
  }

  static date({ keyword = false }: { keyword?: boolean } = {}): z.infer<
    typeof IndexMappings
  > {
    const base: z.infer<typeof IndexMappings> = {
      type: 'date',
    };
    if (keyword) {
      return {
        ...base,
        fields: {
          keyword: this.keywordOnly(),
        },
      };
    }
    return base;
  }

  static flatObject(): z.infer<typeof IndexMappings> {
    return {
      type: 'flat_object',
    };
  }

  static keyword({
    ignoreAbove = DEFAULT_KEYWORD_IGNORE_ABOVE,
  }: {
    ignoreAbove?: number;
  } = {}): z.infer<typeof IndexMappings> {
    return {
      type: 'text',
      fields: {
        keyword: this.keywordOnly({ ignoreAbove }),
      },
    };
  }

  static keywordOnly({
    ignoreAbove = DEFAULT_KEYWORD_IGNORE_ABOVE,
  }: {
    ignoreAbove?: number;
  } = {}): z.infer<typeof IndexMappings> {
    return {
      type: 'keyword',
      ignore_above: ignoreAbove,
    };
  }

  static text(): z.infer<typeof IndexMappings> {
    return {
      type: 'text',
    };
  }
}
