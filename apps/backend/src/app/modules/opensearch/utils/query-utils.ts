export class QueryUtils {
  static createFilter(params: {
    exisitingField: string;
  }): Record<string, unknown>[] {
    return [
      {
        exists: {
          field: params.exisitingField,
        },
      },
    ];
  }

  static getTermsFilter(params: { field: string; values: string[] }) {
    if (params.values.length > 0) {
      return {
        terms: {
          [`${params.field}.keyword`]: params.values,
        },
      };
    }
    return undefined;
  }

  static getWildcardFilter(params: { field: string; value: string }) {
    if (params.value.length > 0) {
      return {
        wildcard: {
          [`${params.field}.keyword`]: {
            value: `*${params.value}*`,
            case_insensitive: true,
          },
        },
      };
    }
    return undefined;
  }
}
