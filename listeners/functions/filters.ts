import type { AllMiddlewareArgs, SlackEventMiddlewareArgs } from '@slack/bolt';
import { isWebAPICallError } from '../type-guards.js';
import { isFilterInputs } from './type-guards.js';
import type { SearchFilter } from './types.js';

const FilterService = {
  FILTER_PROCESSING_ERROR_MSG:
    'We encountered an issue processing filter results. Please try again or contact the app owner if the problem persists.',
};

async function filtersCallback({
  ack,
  inputs,
  fail,
  complete,
  logger,
}: AllMiddlewareArgs & SlackEventMiddlewareArgs<'function_executed'>) {
  try {
    if (!isFilterInputs(inputs)) {
      logger.error(`Invalid filter inputs provided - received: ${JSON.stringify(inputs)}`);
      await fail({ error: FilterService.FILTER_PROCESSING_ERROR_MSG });
      return;
    }
    const { user_context } = inputs;
    logger.debug(`User ${user_context.id} executing filter request`);

    const filters: SearchFilter[] = [
      {
        name: 'languages',
        display_name: 'Languages',
        type: 'multi_select',
        options: [
          { name: 'Python', value: 'python' },
          { name: 'Java', value: 'java' },
          { name: 'JavaScript', value: 'javascript' },
          { name: 'TypeScript', value: 'typescript' },
        ],
      },
      {
        name: 'type',
        display_name: 'Type',
        type: 'multi_select',
        options: [
          { name: 'Template', value: 'template' },
          { name: 'Sample', value: 'sample' },
        ],
      },
    ];

    await complete({ outputs: { filters } });
  } catch (error) {
    if (isWebAPICallError(error)) {
      logger.error(`Slack API call failed with error code ${error.code}. Check error details below:`, error);
    } else {
      logger.error(
        `Unexpected error occurred while processing filters request: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    await fail({ error: FilterService.FILTER_PROCESSING_ERROR_MSG });
  } finally {
    await ack();
  }
}

export { filtersCallback, FilterService };
