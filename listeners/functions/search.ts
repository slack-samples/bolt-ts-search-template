import type { AllMiddlewareArgs, FunctionInputs, SlackEventMiddlewareArgs } from '@slack/bolt';
import Fuse from 'fuse.js';
import { isObject, isSlackSampleDataResponse, isString, isUserContext } from './type-guards';
import type { UserContext } from './types';

const ERROR_MESSAGES = {
  SEARCH_PROCESSING_ERROR:
    'We encountered an issue processing your search results. Please try again or contact the app owner if the problem persists.',
} as const;

interface SearchInputs extends FunctionInputs {
  query: string;
  filters: Record<string, boolean | string | string[]>;
  user_context: UserContext;
}

function isSearchInputs(inputs: FunctionInputs): inputs is SearchInputs {
  if (!isString(inputs.query) || !isObject(inputs.filters) || !isUserContext(inputs.user_context)) {
    return false;
  }
  return true;
}

const searchCallback = async ({
  ack,
  inputs,
  fail,
  complete,
  client,
  logger,
}: AllMiddlewareArgs & SlackEventMiddlewareArgs<'function_executed'>) => {
  try {
    if (!isSearchInputs(inputs)) {
      logger.error(`Invalid search inputs provided - received: ${JSON.stringify(inputs)}`);
      await fail({ error: ERROR_MESSAGES.SEARCH_PROCESSING_ERROR });
      return;
    }

    const { query, filters, user_context } = inputs;
    logger.debug(`User ${user_context.id} executing search query: "${query}" with filters: ${JSON.stringify(filters)}`);

    const response = await client.apiCall('developer.sampleData.get', { filters: JSON.stringify(filters) });

    if (!response.ok) {
      logger.error(`Search API request failed with error: ${response.error}`);
      await fail({ error: ERROR_MESSAGES.SEARCH_PROCESSING_ERROR });
      return;
    }

    if (!isSlackSampleDataResponse(response)) {
      logger.error(`Failed to parse API response as sample data. Received: ${JSON.stringify(response)}`);
      await fail({ error: ERROR_MESSAGES.SEARCH_PROCESSING_ERROR });
      return;
    }

    const fuse = new Fuse(response.samples, {
      keys: ['title', 'description', 'content'],
      shouldSort: true,
      threshold: 0.6,
    });

    const results = fuse.search(query);

    await complete({
      outputs: {
        search_result: results.map((result) => {
          return result.item;
        }),
      },
    });
  } catch (error) {
    logger.error('Search function error:', error);
    await fail({ error: ERROR_MESSAGES.SEARCH_PROCESSING_ERROR });
  } finally {
    await ack();
  }
};

export default searchCallback;
