import { Injectable } from '@angular/core';
import type { AppRouterInputs } from '@sca/trpc-api';
import { from } from 'rxjs';

import { BaseApiService } from './base-api.service';

type Inputs = AppRouterInputs['dashboards'];

@Injectable({
  providedIn: 'root',
})
export class DashboardsApiService {
  private readonly client = this.api.client.dashboards;

  constructor(private readonly api: BaseApiService) {}

  getSideBySide(input: Inputs['getSideBySide']) {
    return from(this.client.getSideBySide.query(input));
  }

  getMultiSelect(input: Inputs['getMultiSelect']) {
    return from(this.client.getMultiSelect.query(input));
  }
}
