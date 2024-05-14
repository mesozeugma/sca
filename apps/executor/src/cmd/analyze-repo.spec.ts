import { AnalysisUtils } from '@sca/executor-lib';

import { main } from './analyze-repo';

describe('analyze-repo', () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
    jest.resetAllMocks();
  });

  test('analyze-repo', async () => {
    const insertBulkAnalysisOutputMock = jest
      .spyOn(AnalysisUtils.prototype, 'export')
      .mockResolvedValue(undefined);

    await main(['./libs/executor-lib/code-samples/java/']);
    expect(insertBulkAnalysisOutputMock.mock.calls).toMatchSnapshot();
  });
});
