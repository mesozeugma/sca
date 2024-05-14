import { Injectable } from '@nestjs/common';
import { Pagination } from '@sca/trpc-api';
import Axios, { AxiosInstance } from 'axios';
import { z } from 'zod';

import { OpensearchIndex, OpensearchSearch } from './consts';
import { OpensearchConfigService } from './opensearch.config';
import { BulkItemSchema } from './schemas/bulk-item.schema';
import { GetIndexInfoResponse, IndexMappings } from './schemas/index.schema';

const InsertBulkItems = BulkItemSchema.array();
const InsertResponse = z.object({ _id: z.string() }).strip();
const GetDocumentByIdResponse = InsertResponse.extend({
  _source: z.object({}).passthrough(),
}).strip();

@Injectable()
export class OpensearchClient {
  private readonly http: AxiosInstance;

  constructor(configService: OpensearchConfigService) {
    const config = configService.get();
    this.http = Axios.create({
      baseURL: config.baseUrl,
    });
  }

  async createIndex(index: OpensearchIndex) {
    await this.http.put(index);
  }

  /**
   * @returns the index info or undefined if index not exists
   */
  async getIndex(index: OpensearchIndex) {
    const response = await this.http.get(index, {
      validateStatus: (status) => {
        return status < 300 || status === 404;
      },
    });
    if (response.status === 404) {
      return undefined;
    }
    const validatedResponse = GetIndexInfoResponse.parse(response.data);
    return validatedResponse[index];
  }

  async updateIndexMappings(
    index: OpensearchIndex,
    mappings: z.input<typeof IndexMappings>
  ) {
    await this.http.put(`${index}/_mapping`, IndexMappings.parse(mappings));
  }

  /**
   * @returns true if index existed
   */
  async deleteIndex(index: OpensearchIndex) {
    const response = await this.http.delete(index, {
      validateStatus: (status) => {
        return status < 300 || status === 404;
      },
    });
    return response.status !== 404;
  }

  private static chunk<T>(items: T[], chunkSize: number): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      result.push(chunk);
    }
    return result;
  }

  async insertBulk(items: z.infer<typeof InsertBulkItems>, bulkSize = 100) {
    const chunks = OpensearchClient.chunk(items, bulkSize);

    for (const chunk of chunks) {
      let body = '';
      for (const item of chunk) {
        const openSearchBulkCreate = JSON.stringify({
          create: { _index: item.index },
        });
        const objectJson = JSON.stringify(item.data);
        body += `${openSearchBulkCreate}\n${objectJson}\n`;
      }

      await this.http.post('_bulk', body, {
        headers: { 'Content-Type': 'application/x-ndjson' },
      });
    }
  }

  async insertDocument(index: OpensearchIndex, content: unknown) {
    const response = await this.http.post(`${index}/_doc`, content, {
      params: { refresh: 'wait_for' },
    });
    return InsertResponse.parse(response.data)._id;
  }

  async upsertDocument(index: OpensearchIndex, id: string, content: unknown) {
    await this.http.put(`${index}/_doc/${id}`, content, {
      params: { refresh: 'wait_for' },
    });
  }

  async deleteDocument(index: OpensearchIndex, id: string) {
    await this.http.delete(`${index}/_doc/${id}`, {
      params: { refresh: 'wait_for' },
    });
  }

  async updateByQuery(
    index: OpensearchIndex,
    queryBody: Record<string, unknown>
  ) {
    await this.http.post(`${index}/_update_by_query`, queryBody);
  }

  async deleteByQuery(
    index: OpensearchIndex,
    queryBody: Record<string, unknown>
  ) {
    await this.http.post(`${index}/_delete_by_query`, queryBody);
  }

  async search(
    index: OpensearchIndex,
    queryBody: Record<string, unknown>
  ): Promise<unknown> {
    const response = await this.http.post(`${index}/_search`, queryBody);
    return response.data;
  }

  async searchPaginated(
    index: OpensearchIndex,
    pagination: Pagination,
    queryBody: Record<string, unknown>
  ): Promise<unknown> {
    const response = await this.http.post(`${index}/_search`, {
      from: pagination.limit * pagination.page,
      size: pagination.limit,
      ...queryBody,
    });
    return response.data;
  }

  /**
   * @returns the document or undefined if document not exists
   */
  async getDocumentById(index: OpensearchIndex, id: string) {
    const response = await this.http.get(`${index}/_doc/${id}`, {
      validateStatus: (status) => {
        return status < 300 || status === 404;
      },
    });
    if (response.status === 404) {
      return undefined;
    }
    return GetDocumentByIdResponse.parse(response.data);
  }

  async createTemplate(
    name: OpensearchSearch,
    template: Record<string, unknown>
  ) {
    await this.http.put(`_scripts/${name}`, template);
  }

  async searchUsingTemplate(
    name: OpensearchSearch,
    index: OpensearchIndex,
    params: Record<string, unknown>
  ): Promise<unknown> {
    const response = await this.http.post(`${index}/_search/template`, {
      id: name,
      params,
    });
    return response.data;
  }

  searchUsingTemplatePaginated(
    name: OpensearchSearch,
    index: OpensearchIndex,
    pagination: Pagination,
    params: Record<string, unknown>
  ): Promise<unknown> {
    return this.searchUsingTemplate(name, index, {
      ...params,
      from: pagination.limit * pagination.page,
      size: pagination.limit,
    });
  }
}
