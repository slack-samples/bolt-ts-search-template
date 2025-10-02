import type { Logger } from '@slack/bolt';
import type { WebClient } from '@slack/web-api';
import { isSlackSampleDataResponse } from './type-guards';
import type { Filters } from './types';

export class SlackResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SlackResponseError';
  }
}

export const SampleDataService = {
  fetchSampleData: async ({
    client,
    filters = {},
    logger,
  }: {
    client: WebClient;
    filters?: Filters;
    logger: Logger;
  }) => {
    const response = await client.apiCall('developer.sampleData.get', { filters: JSON.stringify(filters) });

    if (!response.ok) {
      logger.error(`Search API request failed with error: ${response.error}`);
      throw new SlackResponseError('Failed to fetch sample data from Slack API');
    }

    if (!isSlackSampleDataResponse(response)) {
      logger.error(`Failed to parse API response as sample data. Received: ${JSON.stringify(response)}`);
      throw new SlackResponseError('Invalid response format from Slack API');
    }
    return response;
  },
};
