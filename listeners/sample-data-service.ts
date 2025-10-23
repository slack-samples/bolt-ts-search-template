import { SAMPLES_FILTER, TEMPLATES_FILTER } from './functions/filters.js';
import { isSlackSampleDataResponse } from './type-guards.js';
import type { DeveloperSampleDataGetOptions, FetchSampleDataOptions } from './types.js';

export class SlackResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SlackResponseError';
  }
}

export const SampleDataService = {
  API_METHOD: 'developer.sampleData.get',
  fetchSampleData: async ({ client, query, filters, logger }: FetchSampleDataOptions) => {
    const options: DeveloperSampleDataGetOptions = {
      ...(query && { query }),
    };
    if (filters) {
      const selectedFilters: DeveloperSampleDataGetOptions['filters'] = {};
      const languages = filters.languages;
      const templates = filters.template ?? false;
      const samples = filters.sample ?? false;

      if (languages && Array.isArray(languages) && languages.length > 0) {
        selectedFilters.languages = languages;
      }

      if (xor(templates, samples)) {
        if (templates) {
          selectedFilters.type = TEMPLATES_FILTER.name;
        } else if (samples) {
          selectedFilters.type = SAMPLES_FILTER.name;
        }
      }

      if (Object.entries(selectedFilters).length > 0) {
        options.filters = selectedFilters;
      }
    }
    const response = await client.apiCall(SampleDataService.API_METHOD, options);

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

const xor = (a: boolean, b: boolean): boolean => {
  return (a || b) && !(a && b);
};
