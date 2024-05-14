import { Injectable } from '@nestjs/common';
import { z } from 'zod';

import { OpensearchDashboardsHTTPClient } from './http-client';

export enum SavedObjectType {
  DASHBOARD = 'dashboard',
  INDEX_PATTERN = 'index-pattern',
  SEARCH = 'search',
  VISUALIZATION = 'visualization',
}

const SavedObjectItemAttributes = z.object({ title: z.string() }).strip();
const SavedObjectItem = z
  .object({
    attributes: SavedObjectItemAttributes,
    type: z.string(),
    id: z.string().uuid(),
  })
  .strip();

const SavedObjectItemResult = SavedObjectItem.transform((value) => ({
  id: value.id,
  type: value.type,
  title: value.attributes.title,
}));
const SavedObjectSearchResult = z
  .object({
    saved_objects: z.array(SavedObjectItemResult),
  })
  .strip();

const SavedObjectCreationDTO = z
  .object({
    attributes: z.object({ title: z.string() }).passthrough(),
  })
  .passthrough();

@Injectable()
export class OpensearchDashboardsSavedObjects {
  constructor(private readonly client: OpensearchDashboardsHTTPClient) {}

  async getByType(type: SavedObjectType) {
    const params = new URLSearchParams();
    params.append('fields', 'title');
    params.append('fields', 'type');
    params.append('per_page', '10000');
    params.append('type', type);
    const response = await this.client.http.get('saved_objects/_find', {
      params,
    });
    const data = await SavedObjectSearchResult.parseAsync(response.data);
    return data.saved_objects;
  }

  async save(type: SavedObjectType, payload: unknown) {
    const data = await SavedObjectCreationDTO.parseAsync(payload);
    const title = data.attributes.title;
    const savedObjectList = await this.getByType(type);
    const savedObject = savedObjectList.find((value) => value.title === title);
    let urlPostfix = '';
    if (savedObject) {
      urlPostfix = `/${savedObject.id}`;
    }
    const response = await this.client.http.post(
      `saved_objects/${type}${urlPostfix}`,
      data,
      {
        params: { overwrite: 'true' },
      }
    );
    return await SavedObjectItemResult.parseAsync(response.data);
  }

  async delete(type: SavedObjectType, id: string) {
    const params = new URLSearchParams();
    params.append('force', 'false');
    await this.client.http.delete(`saved_objects/${type}/${id}`, {
      params,
    });
  }
}
