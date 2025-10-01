import type { AllMiddlewareArgs, SlackEventMiddlewareArgs } from '@slack/bolt';
import type { SearchFilter } from './types';

const filtersCallback = async ({
  ack,
  inputs,
  fail,
  complete,
  logger,
}: AllMiddlewareArgs & SlackEventMiddlewareArgs<'function_executed'>) => {
  try {
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
