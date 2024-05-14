import { Injectable } from '@angular/core';
import type { AppRouterInputs, AppRouterOutputs } from '@sca/trpc-api';
import { from } from 'rxjs';

import { BaseApiService } from './base-api.service';

type Inputs = AppRouterInputs['tasks'];
type Outputs = AppRouterOutputs['tasks'];
export type Task = Outputs['getById'];
export type TaskList = Outputs['list'];

@Injectable({
  providedIn: 'root',
})
export class TasksApiService {
  private readonly client = this.api.client.tasks;

  constructor(private readonly api: BaseApiService) {}

  approve(input: Inputs['approve']) {
    return from(this.client.approve.mutate(input));
  }

  createAnalyzeCommitsTask(input: Inputs['createAnalyzeCommitsTask']) {
    return from(this.client.createAnalyzeCommitsTask.mutate(input));
  }

  createAnalyzeRepositoryTask(input: Inputs['createAnalyzeRepositoryTask']) {
    return from(this.client.createAnalyzeRepositoryTask.mutate(input));
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

  listByRepository(input: Inputs['listByRepository']) {
    return from(this.client.listByRepository.query(input));
  }
}
