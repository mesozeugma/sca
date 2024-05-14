import { Injectable, Logger } from '@nestjs/common';
import Axios, { AxiosInstance } from 'axios';
import { wrapper as axiosCookieJarSupport } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';

import { OpensearchDashboardsConfigService } from '../opensearch-dashboards.config';

@Injectable()
export class OpensearchDashboardsHTTPClient {
  private readonly logger = new Logger(OpensearchDashboardsHTTPClient.name);
  private readonly config = this.configService.get();
  #http: AxiosInstance | undefined;
  get http() {
    if (this.#http) {
      return this.#http;
    }
    throw Error('Client not ready');
  }

  constructor(
    private readonly configService: OpensearchDashboardsConfigService
  ) {
    this.getHttpClient();
  }

  private async switchTenant(
    client: AxiosInstance,
    username: string,
    tenant: string
  ) {
    await client.post('/v1/multitenancy/tenant', {
      username,
      tenant: tenant !== 'gloabl' ? tenant : '',
    });
  }

  async getHttpClient() {
    this.logger.debug('Refreshing Opensearch Dashboards client...');
    const jar = new CookieJar();
    const http = Axios.create({
      baseURL: `${this.config.baseUrl}/api`,
      headers: {
        'osd-xsrf': 'true',
      },
      withCredentials: true,
      jar,
    });
    axiosCookieJarSupport(http);

    try {
      // sets a cookie, does not return 400 without cookie
      await http.get('/v1/restapiinfo');
      await this.switchTenant(http, this.config.username, this.config.tenant);
      this.logger.debug('Refreshed Opensearch Dashboards client');
    } catch (err: unknown) {
      this.logger.error(err);
      this.logger.error(
        `Failed to refresh Opensearch Dashboards client - ${err}`
      );
    }

    this.#http = http;
  }
}
