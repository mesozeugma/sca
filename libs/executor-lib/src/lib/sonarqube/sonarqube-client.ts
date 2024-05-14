import axios, { Axios, AxiosResponse } from 'axios';

export class SonarQubeClient {
  protected readonly httpClient: Axios;

  constructor(url: string, token: string) {
    this.httpClient = new axios.Axios({
      baseURL: url + '/api/',
      auth: { username: token, password: '' },
    });
  }

  private checkStatusCode(response: AxiosResponse<unknown, unknown>) {
    if (response.status > 299) {
      throw Error(
        `Bad response from SonarQube status code is ${response.status}`
      );
    }
  }

  async get(url: string, params: Record<string, string>) {
    const response = await this.httpClient.get(url, {
      params,
    });
    this.checkStatusCode(response);
    return JSON.parse(response.data);
  }

  getPage(
    url: string,
    params: Record<string, string>,
    page = 1,
    pageSize = 100
  ) {
    return this.get(url, {
      ...params,
      p: String(page),
      ps: String(pageSize),
    });
  }
}
