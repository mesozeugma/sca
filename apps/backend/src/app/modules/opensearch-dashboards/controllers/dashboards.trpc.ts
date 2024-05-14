import { Injectable } from '@nestjs/common';
import {
  DashboardsGetMultiSelectInput,
  DashboardsGetSideBySideInput,
  IDashboardsController,
} from '@sca/trpc-api';

import { OpensearchDashboardsConfigService } from '../opensearch-dashboards.config';
import { OpensearchDashboardsDashboards } from '../services/dashboards';

@Injectable()
export class DashboardsTRPCController implements IDashboardsController {
  private readonly opensearchDashboardsConfig = this.configService.get();

  constructor(
    private readonly configService: OpensearchDashboardsConfigService,
    private readonly opensearchDashboards: OpensearchDashboardsDashboards
  ) {}

  getDashboardUrl(dashboardId: string, fromDate: Date, toDate: Date) {
    return `/opensearch-dashboards/app/dashboards?security_tenant=${
      this.opensearchDashboardsConfig.tenant
    }#/view/${dashboardId}?embed=true&_g=(filters%3A!()%2CrefreshInterval%3A(pause%3A!f%2Cvalue%3A900000)%2Ctime%3A(from%3A'${fromDate.toISOString()}'%2Cto%3A'${toDate.toISOString()}'))&hide-filter-bar=true`;
  }

  async getMultiSelect(input: DashboardsGetMultiSelectInput) {
    const dashboard =
      await this.opensearchDashboards.createMultiSelectDashboard(
        input.repositories,
        input.panels
      );
    return {
      url: this.getDashboardUrl(dashboard.id, input.from, input.to),
      height: dashboard.height,
    };
  }

  async getSideBySide(input: DashboardsGetSideBySideInput) {
    const dashboard = await this.opensearchDashboards.createSideBySideDashboard(
      input.repository,
      input.repository2,
      input.panels
    );
    return {
      url: this.getDashboardUrl(dashboard.id, input.from, input.to),
      height: dashboard.height,
    };
  }
}
