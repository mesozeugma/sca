import { Injectable } from '@nestjs/common';
import { z } from 'zod';

import { OpensearchDashboardsHTTPClient } from './http-client';
import {
  OpensearchDashboardsSavedObjects,
  SavedObjectType,
} from './saved-objects';

export enum IndexPattern {
  PRIMARY_LINE_COUNTS = 'public_sca_analysis_result_primary_line_counts',
  REPOSITORY_IMPORTS = 'public_sca_analysis_result_repository_imports',
  SEMANTIC = 'public_sca_analysis_result_semantic',
  SONARQUBE_METRICS = 'public_sca_analysis_result_sonarqube_metrics',
}

export const IndexPatternFieldDefinitionSchema = z
  .object({
    count: z.number().default(0),
    name: z.string(),
    type: z.string(),
    esTypes: z.string().array().optional(),
    scripted: z.boolean().default(false),
    searchable: z.boolean(),
    aggregatable: z.boolean(),
    readFromDocValues: z.boolean(),
    subType: z.object({}).passthrough().optional(),
  })
  .strict();
export type IndexPatternFieldDefinition = z.infer<
  typeof IndexPatternFieldDefinitionSchema
>;
export const GetIndexFieldDefinitionsResult = z
  .object({ fields: IndexPatternFieldDefinitionSchema.array() })
  .strip();

const IndexPatternDefinitionSchema = z
  .object({
    attributes: z
      .object({
        fields: z
          .string()
          .transform((v) => JSON.parse(v))
          .pipe(IndexPatternFieldDefinitionSchema.array()),
      })
      .strip(),
  })
  .strip();

@Injectable()
export class OpensearchDashboardsIndexPatterns {
  savedObjectType = SavedObjectType.INDEX_PATTERN;

  constructor(
    private readonly client: OpensearchDashboardsHTTPClient,
    private readonly savedObjectsClient: OpensearchDashboardsSavedObjects
  ) {}

  async getIndexPatterns() {
    return await this.savedObjectsClient.getByType(this.savedObjectType);
  }

  async getOne(name: IndexPattern) {
    const indexPatterns = await this.getIndexPatterns();
    return indexPatterns.find((value) => value.title === name);
  }

  async requireOne(name: IndexPattern) {
    const indexPattern = await this.getOne(name);
    if (!indexPattern) {
      throw Error(`"${name}" index pattern not found`);
    }
    return indexPattern;
  }

  async getIndexFieldDefinitions(name: IndexPattern) {
    const params = new URLSearchParams();
    params.append('pattern', name);
    params.append('meta_fields', '_source');
    params.append('meta_fields', '_id');
    params.append('meta_fields', '_type');
    params.append('meta_fields', '_index');
    params.append('meta_fields', '_score');
    const response = await this.client.http.get(
      '/index_patterns/_fields_for_wildcard',
      { params }
    );
    const data = await GetIndexFieldDefinitionsResult.parseAsync(response.data);
    return data.fields;
  }

  async getIndexPatternFieldDefinitions(id: string) {
    const response = await this.client.http.get(
      `/saved_objects/${this.savedObjectType}/${id}`
    );
    const data = await IndexPatternDefinitionSchema.parseAsync(response.data);
    return data.attributes.fields;
  }

  save(
    name: IndexPattern,
    fields: IndexPatternFieldDefinition[],
    timeFieldName = ''
  ) {
    const attributes: Record<string, unknown> = {
      title: name,
      fields: JSON.stringify(
        IndexPatternFieldDefinitionSchema.array().parse(fields)
      ),
    };
    if (timeFieldName.length > 0) {
      attributes['timeFieldName'] = timeFieldName;
    }
    const payload = {
      attributes,
    };
    return this.savedObjectsClient.save(this.savedObjectType, payload);
  }

  async delete(name: IndexPattern) {
    const indexPattern = await this.getOne(name);
    if (!indexPattern) {
      return;
    }
    await this.savedObjectsClient.delete(this.savedObjectType, indexPattern.id);
  }
}
