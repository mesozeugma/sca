import { Injectable } from '@angular/core';
import type { AppRouterInputs, AppRouterOutputs } from '@sca/trpc-api';
import { from } from 'rxjs';

import { BaseApiService } from './base-api.service';

type Inputs = AppRouterInputs['repositories'];
type Outputs = AppRouterOutputs['repositories'];
export type Repository = Outputs['getById'];
export type RepositoryUpsertOptions = Outputs['getUpsertOptions'];
export type RepositoryAnalysesList = Outputs['listAnalyses'];
export type RepositoryPublicAnalysesList = Outputs['listPublicAnalyses'];
export type RepositoryPublicAnalysis = RepositoryPublicAnalysesList['items'][0];
export type RepositoryList = Outputs['list'];

@Injectable({
  providedIn: 'root',
})
export class RepositoriesApiService {
  private readonly client = this.api.client.repositories;

  constructor(private readonly api: BaseApiService) {}

  create(input: Inputs['create']) {
    return from(this.client.create.mutate(input));
  }

  delete(input: Inputs['delete']) {
    return from(this.client.delete.mutate(input));
  }

  deleteAnalysis(input: Inputs['deleteAnalysis']) {
    return from(this.client.deleteAnalysis.mutate(input));
  }

  getById(input: Inputs['getById']) {
    return from(this.client.getById.query(input));
  }

  list(input: Inputs['list']) {
    return from(this.client.list.query(input));
  }

  listAnalyses(input: Inputs['listAnalyses']) {
    return from(this.client.listAnalyses.query(input));
  }

  listPublicAnalyses(input: Inputs['listPublicAnalyses']) {
    return from(this.client.listPublicAnalyses.query(input));
  }

  upsert(input: Inputs['upsert']) {
    return from(this.client.upsert.mutate(input));
  }

  getUpsertOptions() {
    return from(this.client.getUpsertOptions.query({}));
  }
}
