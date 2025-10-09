import assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import type { AckFn, AllMiddlewareArgs, SlackEventMiddlewareArgs } from '@slack/bolt';
import { FilterService, filtersCallback } from '../../../listeners/functions/filters.js';
import { fakeAck, fakeComplete, fakeFail, fakeLogger } from '../../helpers.js';

const validInputs = {
  user_context: { id: 'U123456', secret: 'secret123' },
};

const buildArguments = ({
  ack = fakeAck,
  inputs = validInputs,
  fail = fakeFail,
  complete = fakeComplete,
  logger = fakeLogger,
}: {
  ack?: AckFn<void>;
  inputs?: Record<string, unknown>;
  fail?: typeof fakeFail;
  complete?: typeof fakeComplete;
  logger?: typeof fakeLogger;
}): AllMiddlewareArgs & SlackEventMiddlewareArgs<'function_executed'> => {
  return {
    ack,
    inputs,
    fail,
    complete,
    logger,
  } as unknown as AllMiddlewareArgs & SlackEventMiddlewareArgs<'function_executed'>;
};

describe('filtersCallback', () => {
  beforeEach(() => {
    fakeAck.mock.resetCalls();
    fakeFail.mock.resetCalls();
    fakeComplete.mock.resetCalls();
    fakeLogger.resetCalls();
  });

  it('should successfully process valid filter inputs', async () => {
    await filtersCallback(buildArguments({}));

    assert(fakeComplete.mock.callCount() === 1);
    const completeCallArgs = fakeComplete.mock.calls[0].arguments[0];
    assert(completeCallArgs.outputs);
    assert(Array.isArray(completeCallArgs.outputs.filters));
    assert(completeCallArgs.outputs.filters.length === 2);

    const languagesFilter = completeCallArgs.outputs.filters.find((f: { name: string }) => f.name === 'languages');
    assert.deepStrictEqual(languagesFilter, {
      name: 'languages',
      display_name: 'Languages',
      type: 'multi_select',
      options: [
        { name: 'Python', value: 'python' },
        { name: 'Java', value: 'java' },
        { name: 'JavaScript', value: 'javascript' },
        { name: 'TypeScript', value: 'typescript' },
      ],
    });

    const typeFilter = completeCallArgs.outputs.filters.find((f: { name: string }) => f.name === 'type');
    assert.deepStrictEqual(typeFilter, {
      name: 'type',
      display_name: 'Type',
      type: 'multi_select',
      options: [
        { name: 'Template', value: 'template' },
        { name: 'Sample', value: 'sample' },
      ],
    });

    assert(fakeAck.mock.callCount() === 1);
    assert(fakeFail.mock.callCount() === 0);
  });

  it('should fail when inputs are invalid', async () => {
    const invalidInputs = {
      user_context: null, // Invalid: should be object with id
    };

    await filtersCallback(buildArguments({ inputs: invalidInputs, logger: fakeLogger }));

    assert(fakeLogger.error.mock.callCount() === 1);
    assert(fakeLogger.error.mock.calls[0].arguments[0].includes('Invalid filter inputs provided'));
    assert(fakeFail.mock.callCount() === 1);
    assert.deepStrictEqual(fakeFail.mock.calls[0].arguments[0], {
      error: FilterService.FILTER_PROCESSING_ERROR_MSG,
    });
    assert(fakeComplete.mock.callCount() === 0);
    assert(fakeAck.mock.callCount() === 1);
  });

  it('should fail when user_context is missing', async () => {
    const inputsWithoutUserContext = {};

    await filtersCallback(buildArguments({ inputs: inputsWithoutUserContext }));

    assert(fakeFail.mock.callCount() === 1);
    assert.deepStrictEqual(fakeFail.mock.calls[0].arguments[0], {
      error: FilterService.FILTER_PROCESSING_ERROR_MSG,
    });
    assert(fakeComplete.mock.callCount() === 0);
  });

  it('should fail when user_context is invalid type', async () => {
    const invalidInputs = {
      user_context: 'invalid', // Invalid: should be object
    };

    await filtersCallback(buildArguments({ inputs: invalidInputs }));

    assert(fakeFail.mock.callCount() === 1);
    assert.deepStrictEqual(fakeFail.mock.calls[0].arguments[0], {
      error: FilterService.FILTER_PROCESSING_ERROR_MSG,
    });
    assert(fakeComplete.mock.callCount() === 0);
  });

  it('should handle unexpected errors gracefully', async () => {
    fakeComplete.mock.mockImplementationOnce(() => {
      throw new Error('Unexpected error');
    });

    await filtersCallback(buildArguments({ complete: fakeComplete }));

    assert(fakeLogger.error.mock.callCount() === 1);
    assert(
      fakeLogger.error.mock.calls[0].arguments[0].includes(
        'Unexpected error occurred while processing filters request',
      ),
    );
    assert(fakeFail.mock.callCount() === 1);
    assert.deepStrictEqual(fakeFail.mock.calls[0].arguments[0], {
      error: FilterService.FILTER_PROCESSING_ERROR_MSG,
    });
    assert(fakeAck.mock.callCount() === 1);
  });

  it('should always call ack regardless of success or failure', async () => {
    await filtersCallback(buildArguments({}));
    assert(fakeAck.mock.callCount() === 1);

    fakeAck.mock.resetCalls();
    fakeFail.mock.resetCalls();
    fakeComplete.mock.resetCalls();
    fakeLogger.resetCalls();

    await filtersCallback(buildArguments({ inputs: { user_context: null } }));
    assert(fakeAck.mock.callCount() === 1);

    fakeAck.mock.resetCalls();
    fakeFail.mock.resetCalls();
    fakeComplete.mock.resetCalls();
    fakeLogger.resetCalls();

    fakeComplete.mock.mockImplementationOnce(() => {
      throw new Error('Test error');
    });

    await filtersCallback(buildArguments({}));
    assert(fakeAck.mock.callCount() === 1);
  });
});
