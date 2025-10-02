import type { AllMiddlewareArgs, FunctionInputs, SlackEventMiddlewareArgs } from '@slack/bolt';
import { isUserContext } from './type-guards';
import type { SearchFilter, UserContext } from './types';

const ERROR_MESSAGES = {
  SEARCH_PROCESSING_ERROR:
    'We encountered an issue processing filter results. Please try again or contact the app owner if the problem persists.',
} as const;

interface SearchInputs extends FunctionInputs {
  user_context: UserContext;
}

function isFilterInputs(inputs: FunctionInputs): inputs is SearchInputs {
  if (!isUserContext(inputs.user_context)) {
    return false;
  }
  return true;
}

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
      await fail({ error: ERROR_MESSAGES.SEARCH_PROCESSING_ERROR });
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
    logger.error('Filters function error:', error);
    await fail({ error: `Failed to handle filters request: ${error}` });
  } finally {
    await ack();
  }
};

export default filtersCallback;
