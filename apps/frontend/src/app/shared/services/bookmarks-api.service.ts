import { Location } from '@angular/common';
import { Injectable } from '@angular/core';
import type { AppRouterInputs, AppRouterOutputs } from '@sca/trpc-api';
import { from } from 'rxjs';

import { BaseApiService } from './base-api.service';

type Inputs = AppRouterInputs['bookmarks'];
type Outputs = AppRouterOutputs['bookmarks'];
export type Bookmark = Outputs['getById'];
export type BookmarkList = Outputs['list'];

@Injectable({
  providedIn: 'root',
})
export class BookmarksApiService {
  private readonly client = this.api.client.bookmarks;

  constructor(
    private readonly api: BaseApiService,
    private readonly location: Location
  ) {}

  create(input: Inputs['create']) {
    return from(this.client.create.mutate(input));
  }

  createFromCurrentPath(name: string) {
    const url = new URL(this.location.path(), 'https://placeholder.com');
    return this.create({
      name,
      path: url.pathname,
      queryParams: Object.fromEntries(
        [...url.searchParams.entries()].map(([key, value]) => [
          key,
          typeof value === 'string' ? [value] : value,
        ])
      ),
    });
  }

  delete(input: Inputs['delete']) {
    return from(this.client.delete.mutate(input));
  }

  getById(input: Inputs['getById']) {
    return from(this.client.getById.query(input));
  }

  list(input: Inputs['list']) {
    return from(this.client.list.query(input));
  }

  upsert(input: Inputs['upsert']) {
    return from(this.client.upsert.mutate(input));
  }
}
