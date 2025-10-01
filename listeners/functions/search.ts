import type { AllMiddlewareArgs, FunctionInputs, SlackEventMiddlewareArgs } from '@slack/bolt';
import type { SearchResult, SlackApiResponse } from './types';

interface SearchInputs extends FunctionInputs {
  query: string;
  filters: Record<string, boolean | string | string[]>;
  user_context: {
    id: string;
    secret: string;
  };
}

function isSearchInputs(inputs: FunctionInputs): inputs is SearchInputs {
  if (typeof inputs.query !== 'string') {
    return false;
  }

  if (!inputs.filters || typeof inputs.filters !== 'object') {
    return false;
  }

  if (!inputs.user_context || typeof inputs.user_context !== 'object') {
    return false;
  }

  return true;
}

function isSlackApiResponse(data: unknown): data is SlackApiResponse {
  if (typeof data !== 'object') {
    return false;
  }

  const candidate = data as Record<string, unknown>;

  if (typeof candidate.ok !== 'boolean' || !Array.isArray(candidate.samples)) {
    return false;
  }

  for (const sample of candidate.samples) {
    if (!isSampleData(sample)) {
      return false;
    }
  }

  return true;
}

function isSampleData(data: unknown): data is SearchResult {
  if (typeof data !== 'object') {
    return false;
  }

  const candidate = data as Record<string, unknown>;
  if (
    typeof candidate.title !== 'string' ||
    typeof candidate.description !== 'string' ||
    typeof candidate.date_updated !== 'string' ||
    typeof candidate.link !== 'string'
  ) {
    return false;
  }

  if (!candidate.external_ref || typeof candidate.external_ref !== 'object') {
    return false;
  }

  const externalRef = candidate.external_ref as Record<string, unknown>;
  if (typeof externalRef.id !== 'string') {
    return false;
  }

  if (candidate.content !== undefined && typeof candidate.content !== 'string') {
    return false;
  }

  return true;
}

const searchCallback = async ({
  ack,
  inputs,
  fail,
  complete,
  logger,
}: AllMiddlewareArgs & SlackEventMiddlewareArgs<'function_executed'>) => {
  try {
    // Use the type guard to ensure inputs are valid
    if (!isSearchInputs(inputs)) {
      logger.error('Invalid search inputs provided');
      await fail({ error: 'Invalid search inputs: please reach out to the app owner' });
      return;
    }

    const { query, filters, user_context } = inputs;
    logger.debug(`User executing a search: ${user_context.id}`);

    const url = new URL('https://slack.com/api/developer.sampleData.get');
    url.searchParams.set('filters', JSON.stringify(filters));

    const request = new Request(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

	// TODO: use the client here instead of a fetch
    const response = await fetch(request);

    if (!response.ok) {
      logger.error(`API request failed: ${response.status} ${response.statusText}`);
      await fail({ error: `API request failed: ${response.status}` });
      return;
    }

    const data = await response.json();

    if (!isSlackApiResponse(data) || !data.ok) {
      logger.error(`Failed fetch request from ${response.url}: ${JSON.stringify(data)}`);
      await fail({ error: 'Invalid search result fetch: please reach out to the app owner' });
      return;
    }

    await complete({ outputs: { search_results: data.samples } });
  } catch (error) {
    logger.error('Search function error:', error);
    await fail({ error: `Failed to handle search request: ${error}` });
  } finally {
    await ack();
  }
};

export default searchCallback;
