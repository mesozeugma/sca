import { Injectable } from '@angular/core';
import type { AppRouterInputs, AppRouterOutputs } from '@sca/trpc-api';
import { from } from 'rxjs';

import { BaseApiService } from './base-api.service';

type Inputs = AppRouterInputs['explore'];
type Outputs = AppRouterOutputs['explore'];
export type ClassExploreResult = Outputs['class'];
export type PackageExploreResult = Outputs['package'];

@Injectable({
  providedIn: 'root',
})
export class ExploreApiService {
  private readonly client = this.api.client.explore;

  constructor(private readonly api: BaseApiService) {}

  exploreClass(input: Inputs['class']) {
    return from(this.client.class.query(input));
  }

  explorePackage(input: Inputs['package']) {
    return from(this.client.package.query(input));
  }
}
