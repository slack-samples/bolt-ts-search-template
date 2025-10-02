import type { AllMiddlewareArgs, SlackEventMiddlewareArgs } from '@slack/bolt';
import Fuse from 'fuse.js';
import { SampleDataService } from '../sample-data-fetcher';
import type { SearchResult } from '../types';
import { isSearchInputs } from './type-guards';

export class SlackResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SlackResponseError';
  }
}

export const SearchService = {
  SEARCH_PROCESSING_ERROR_MSG:
    'We encountered an issue processing your search results. Please try again or contact the app owner if the problem persists.',

  fuzzySearch: async ({ query, samples }: { query: string; samples: SearchResult[] }) => {
    const fuse = new Fuse(samples, {
      keys: ['title', 'description', 'content'],
      shouldSort: true,
      threshold: 0.6,
    });

    const results = fuse.search(query);

    return results.map((result) => {
      return result.item;
    });
  },
};

async function searchCallback({
  ack,
  inputs,
  fail,
  complete,
  client,
  logger,
}: AllMiddlewareArgs & SlackEventMiddlewareArgs<'function_executed'>) {
  try {
    if (!isSearchInputs(inputs)) {
      logger.error(`Invalid search inputs provided - received: ${JSON.stringify(inputs)}`);
      await fail({ error: SearchService.SEARCH_PROCESSING_ERROR_MSG });
      return;
    }

    const { query, filters, user_context } = inputs;
    logger.debug(`User ${user_context.id} executing search query: "${query}" with filters: ${JSON.stringify(filters)}`);

    const response = await SampleDataService.fetchSampleData({ client, filters, logger });

    await complete({
      outputs: {
        search_result: await SearchService.fuzzySearch({ query, samples: response.samples }),
      },
    });
  } catch (error) {
    if (error instanceof SlackResponseError) {
      logger.error(`Failed to fetch or parse sample data. Error details: ${error.message}`);
    } else {
      logger.error(
        `Unexpected error occurred while processing search request: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    await fail({ error: SearchService.SEARCH_PROCESSING_ERROR_MSG });
  } finally {
    await ack();
  }
}

export default searchCallback;
