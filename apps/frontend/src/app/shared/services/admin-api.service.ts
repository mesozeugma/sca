import { Injectable } from '@angular/core';
import type { AppRouterInputs } from '@sca/trpc-api';
import { from } from 'rxjs';

import { BaseApiService } from './base-api.service';

type Inputs = AppRouterInputs['admin'];

@Injectable({
  providedIn: 'root',
})
export class AdminApiService {
  private readonly client = this.api.client.admin;

  constructor(private readonly api: BaseApiService) {}

  whoAmI(input: Inputs['whoAmI'] = {}) {
    return from(this.client.whoAmI.query(input));
  }
}
