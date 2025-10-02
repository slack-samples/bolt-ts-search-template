import type { AllMiddlewareArgs, SlackEventMiddlewareArgs } from '@slack/bolt';
import { isFilterInputs } from './type-guards';
import type { SearchFilter } from './types';

const ERROR_MESSAGES = {
  FILTER_PROCESSING_ERROR:
    'We encountered an issue processing filter results. Please try again or contact the app owner if the problem persists.',
} as const;

const filtersCallback = async ({
  ack,
  inputs,
  fail,
  complete,
  logger,
}: AllMiddlewareArgs & SlackEventMiddlewareArgs<'function_executed'>) => {
  try {
    if (!isFilterInputs(inputs)) {
      logger.error(`Invalid filter inputs provided - received: ${JSON.stringify(inputs)}`);
      await fail({ error: ERROR_MESSAGES.FILTER_PROCESSING_ERROR });
      return;
    }
    const { user_context } = inputs as { user_context: { id: string } };
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
    logger.error(
      `Unexpected error occurred while processing filters request: ${error instanceof Error ? error.message : String(error)}`,
    );
    await fail({ error: ERROR_MESSAGES.FILTER_PROCESSING_ERROR });
  } finally {
    await ack();
  }
};

export default filtersCallback;
