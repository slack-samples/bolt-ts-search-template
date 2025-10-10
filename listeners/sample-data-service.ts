import type { Logger } from '@slack/bolt';
import type { WebClient } from '@slack/web-api';
import { isSlackSampleDataResponse } from './type-guards.js';
import type { Filters } from './types.js';

export class SlackResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SlackResponseError';
  }
}

export const SampleDataService = {
  fetchSampleData: async ({
    client,
    query,
    filters,
    logger,
  }: {
    client: WebClient;
    query?: string;
    filters?: Filters;
    logger: Logger;
  }) => {
    const options: { query?: string; filters?: Record<string, string | string[]> } = {
      ...(query && { query }),
    };
    if (filters) {
      const languagesFilter = filters.languages ?? [];
      const typeFilter = filters.type ?? [];

      const selectedFilters = {
        ...(languagesFilter.length > 0 && { languages: languagesFilter }),
        ...(typeFilter.length === 1 && { type: typeFilter[0] }),
      };
      if (Object.keys(selectedFilters).length > 0) {
        options.filters = selectedFilters;
      }
    }
    const response = await client.apiCall('developer.sampleData.get', options);

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
