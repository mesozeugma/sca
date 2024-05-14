import { SonarQubeClient } from './sonarqube-client';

class Response {
  pageCount: number;
  issues: unknown[];

  constructor(pageCount: number, issues: unknown[]) {
    this.pageCount = pageCount;
    this.issues = issues;
  }
}

export class SonarQubeIssues {
  constructor(private readonly client: SonarQubeClient) {}

  private async getPage(
    repositoryKey: string,
    page: number
  ): Promise<Response> {
    const pageSize = 100;
    const response = await this.client.getPage(
      '/issues/search',
      {
        componentKeys: repositoryKey,
      },
      page,
      pageSize
    );
    return new Response(Math.ceil(response.total / pageSize), response.issues);
  }

  async getIssues(repositoryKey: string) {
    const result: unknown[] = [];
    const firstResponse = await this.getPage(repositoryKey, 1);
    result.push(...firstResponse.issues);
    for (let index = 2; index < firstResponse.pageCount; index++) {
      const response = await this.getPage(repositoryKey, index);
      result.push(...response.issues);
    }
    return result;
  }
}
