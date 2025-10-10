import assert from 'node:assert';
import { beforeEach, describe, it, mock } from 'node:test';
import type { AckFn, AllMiddlewareArgs, SlackEventMiddlewareArgs } from '@slack/bolt';
import { SearchService, searchCallback } from '../../../listeners/functions/search.js';
import { SampleDataService, SlackResponseError } from '../../../listeners/sample-data-service.js';
import { isString } from '../../../listeners/type-guards.js';
import { fakeAck, fakeClient, fakeComplete, fakeFail, fakeLogger, fakeSlackResponse } from '../../helpers.js';

const validInputs = {
  query: 'javascript',
  filters: { language: ['javascript'], type: ['template'] },
  user_context: { id: 'U123456', secret: 'secret123' },
};

const mockFetchSampleData = mock.method(SampleDataService, 'fetchSampleData');

const buildArguments = ({
  ack = fakeAck,
  inputs = validInputs,
  fail = fakeFail,
  complete = fakeComplete,
  client = fakeClient,
  logger = fakeLogger,
}: {
  ack?: AckFn<void>;
  inputs?: Record<string, unknown>;
  fail?: typeof fakeFail;
  complete?: typeof fakeComplete;
  client?: typeof fakeClient;
  logger?: typeof fakeLogger;
}): AllMiddlewareArgs & SlackEventMiddlewareArgs<'function_executed'> => {
  return {
    ack,
    inputs,
    fail,
    complete,
    client,
    logger,
  } as unknown as AllMiddlewareArgs & SlackEventMiddlewareArgs<'function_executed'>;
};

describe('searchCallback', () => {
  beforeEach(() => {
    fakeAck.mock.resetCalls();
    fakeFail.mock.resetCalls();
    fakeComplete.mock.resetCalls();
    fakeLogger.resetCalls();
    mockFetchSampleData.mock.resetCalls();
    mockFetchSampleData.mock.mockImplementation(() => Promise.resolve(fakeSlackResponse));
  });

  it('should successfully process valid search inputs', async () => {
    await searchCallback(buildArguments({}));

    assert(mockFetchSampleData.mock.callCount() === 1);
    assert.deepStrictEqual(mockFetchSampleData.mock.calls[0].arguments[0], {
      client: fakeClient,
      query: validInputs.query,
      filters: validInputs.filters,
      logger: fakeLogger,
    });
    assert(fakeComplete.mock.callCount() === 1);
    const completeCallArgs = fakeComplete.mock.calls[0].arguments[0];
    assert(completeCallArgs.outputs);
    assert(Array.isArray(completeCallArgs.outputs.search_result));

    assert(fakeAck.mock.callCount() === 1);
    assert(fakeFail.mock.callCount() === 0);
  });

  it('should fail when inputs are invalid', async () => {
    const invalidInputs = {
      query: 123, // Invalid: should be string
      filters: 'invalid', // Invalid: should be object
      user_context: null, // Invalid: should be object
    };

    await searchCallback(buildArguments({ inputs: invalidInputs, logger: fakeLogger }));

    assert(fakeLogger.error.mock.callCount() === 1);
    assert(fakeLogger.error.mock.calls[0].arguments[0].includes('Invalid search inputs provided'));
    assert(fakeFail.mock.callCount() === 1);
    assert.deepStrictEqual(fakeFail.mock.calls[0].arguments[0], {
      error: SearchService.SEARCH_PROCESSING_ERROR_MSG,
    });
    assert(fakeComplete.mock.callCount() === 0);
    assert(fakeAck.mock.callCount() === 1);
  });

  it('should handle missing query field', async () => {
    const inputsWithoutQuery = {
      filters: { language: 'javascript' },
      user_context: { id: 'U123456', secret: 'secret123' },
    };

    await searchCallback(buildArguments({ inputs: inputsWithoutQuery }));

    assert(fakeFail.mock.callCount() === 1);
    assert(fakeComplete.mock.callCount() === 0);
  });

  it('should handle SlackResponseError from fetchSampleData', async () => {
    mockFetchSampleData.mock.mockImplementation(() => {
      throw new SlackResponseError('Failed to fetch sample data from Slack API');
    });

    await searchCallback(buildArguments({ logger: fakeLogger }));

    assert(fakeLogger.error.mock.callCount() === 1);
    assert(fakeLogger.error.mock.calls[0].arguments[0].includes('Failed to fetch or parse sample data'));
    assert(fakeFail.mock.callCount() === 1);
    assert.deepStrictEqual(fakeFail.mock.calls[0].arguments[0], {
      error: SearchService.SEARCH_PROCESSING_ERROR_MSG,
    });
    assert(fakeComplete.mock.callCount() === 0);
    assert(fakeAck.mock.callCount() === 1);
  });

  it('should handle unexpected errors', async () => {
    mockFetchSampleData.mock.mockImplementation(() => {
      throw new TypeError('Unexpected error');
    });

    await searchCallback(buildArguments({ logger: fakeLogger }));

    assert(fakeLogger.error.mock.callCount() === 1);
    assert(
      fakeLogger.error.mock.calls[0].arguments[0].includes('Unexpected error occurred while processing search request'),
    );
    assert(fakeFail.mock.callCount() === 1);
    assert.deepStrictEqual(fakeFail.mock.calls[0].arguments[0], {
      error: SearchService.SEARCH_PROCESSING_ERROR_MSG,
    });
    assert(fakeAck.mock.callCount() === 1);
  });

  it('should always call ack regardless of success or failure', async () => {
    await searchCallback(buildArguments({}));

    assert(fakeAck.mock.callCount() === 1);

    mockFetchSampleData.mock.resetCalls();
    fakeAck.mock.resetCalls();
    fakeFail.mock.resetCalls();
    fakeComplete.mock.resetCalls();
    fakeLogger.resetCalls();

    mockFetchSampleData.mock.mockImplementation(() => Promise.reject(new Error('Test error')));

    await searchCallback(buildArguments({}));

    assert(fakeAck.mock.callCount() === 1);
  });

  it('should pass correct search results to complete', async () => {
    await searchCallback(buildArguments({}));

    assert(fakeComplete.mock.callCount() === 1);
    const completeCallArgs = fakeComplete.mock.calls[0].arguments[0];
    assert(completeCallArgs.outputs);
    assert(Array.isArray(completeCallArgs.outputs.search_result));
    assert(completeCallArgs.outputs.search_result.length > 0);

    const firstResult = completeCallArgs.outputs.search_result[0];

    assert(isString(firstResult.title));
    assert(isString(firstResult.description));
    assert(isString(firstResult.link));
  });
});
