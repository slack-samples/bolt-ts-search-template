import type { AllMiddlewareArgs, SlackEventMiddlewareArgs } from '@slack/bolt';
import { SampleDataService, SlackResponseError } from '../sample-data-service.js';
import { isWebAPICallError } from '../type-guards.js';
import { isSearchInputs } from './type-guards.js';

const SEARCH_PROCESSING_ERROR_MSG =
  'We encountered an issue processing your search results. Please try again or contact the app owner if the problem persists.';

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
      await fail({ error: SEARCH_PROCESSING_ERROR_MSG });
      return;
    }

    const { query, filters, user_context } = inputs;
    logger.debug(`User ${user_context.id} executing search query: "${query}" with filters: ${JSON.stringify(filters)}`);

    const response = await SampleDataService.fetchSampleData({ client, query, filters, logger });

    await complete({
      outputs: {
        search_result: response.samples,
      },
    });
  } catch (error) {
    if (error instanceof SlackResponseError) {
      logger.error(`Failed to fetch or parse sample data. Error details: ${error.message}`);
    } else if (isWebAPICallError(error)) {
      logger.error(`Slack API call failed with error code ${error.code}. Check error details below:`, error);
    } else {
      logger.error(
        `Unexpected error occurred while processing search request: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    await fail({ error: SEARCH_PROCESSING_ERROR_MSG });
  } finally {
    await ack();
  }
}

export { searchCallback, SEARCH_PROCESSING_ERROR_MSG };
