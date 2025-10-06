import type { AckFn, AllMiddlewareArgs, Logger, SlackEventMiddlewareArgs } from '@slack/bolt';
import type { WebClient } from '@slack/web-api';
import searchCallback, { SearchService, SlackResponseError } from '../../../listeners/functions/search';
import { SampleDataService } from '../../../listeners/sample-data-service';
import { fakeAck, fakeClient, fakeComplete, fakeFail, fakeLogger, fakeSlackResponse } from '../../helpers';

const validInputs = {
  query: 'javascript',
  filters: { language: 'javascript', type: 'template' },
  user_context: { id: 'U123456', secret: 'secret123' },
};

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
  client?: WebClient;
  logger?: Logger;
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
    jest.clearAllMocks();
  });

  it('should successfully process valid search inputs', async () => {
    jest.spyOn(SampleDataService, 'fetchSampleData').mockResolvedValue(fakeSlackResponse);

    await searchCallback(buildArguments({}));

    expect(SampleDataService.fetchSampleData).toHaveBeenCalledWith({
      client: fakeClient,
      query: validInputs.query,
      filters: validInputs.filters,
      logger: fakeLogger,
    });

    expect(fakeComplete).toHaveBeenCalledWith({
      outputs: {
        search_result: expect.any(Array),
      },
    });

    expect(fakeAck).toHaveBeenCalled();
    expect(fakeFail).not.toHaveBeenCalled();
  });

  it('should fail when inputs are invalid', async () => {
    const invalidInputs = {
      query: 123, // Invalid: should be string
      filters: 'invalid', // Invalid: should be object
      user_context: null, // Invalid: should be object
    };

    await searchCallback(buildArguments({ inputs: invalidInputs }));

    expect(fakeLogger.error).toHaveBeenCalledWith(expect.stringContaining('Invalid search inputs provided'));
    expect(fakeFail).toHaveBeenCalledWith({
      error: SearchService.SEARCH_PROCESSING_ERROR_MSG,
    });
    expect(fakeComplete).not.toHaveBeenCalled();
    expect(fakeAck).toHaveBeenCalled();
  });

  it('should handle missing query field', async () => {
    const inputsWithoutQuery = {
      filters: { language: 'javascript' },
      user_context: { id: 'U123456', secret: 'secret123' },
    };

    await searchCallback(buildArguments({ inputs: inputsWithoutQuery }));

    expect(fakeFail).toHaveBeenCalled();
    expect(fakeComplete).not.toHaveBeenCalled();
  });

  it('should handle SlackResponseError from fetchSampleData', async () => {
    const fakeResponseError = new SlackResponseError('Failed to fetch sample data from Slack API');

    jest.spyOn(SampleDataService, 'fetchSampleData').mockRejectedValue(fakeResponseError);

    await searchCallback(buildArguments({}));

    expect(fakeLogger.error).toHaveBeenCalledWith(expect.stringContaining('Failed to fetch or parse sample data'));
    expect(fakeFail).toHaveBeenCalledWith({
      error: SearchService.SEARCH_PROCESSING_ERROR_MSG,
    });
    expect(fakeComplete).not.toHaveBeenCalled();
    expect(fakeAck).toHaveBeenCalled();
  });

  it('should handle unexpected errors', async () => {
    const unexpectedError = new TypeError('Unexpected error');

    jest.spyOn(SampleDataService, 'fetchSampleData').mockRejectedValue(unexpectedError);

    await searchCallback(buildArguments({}));

    expect(fakeLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Unexpected error occurred while processing search request'),
    );
    expect(fakeFail).toHaveBeenCalledWith({
      error: SearchService.SEARCH_PROCESSING_ERROR_MSG,
    });
    expect(fakeAck).toHaveBeenCalled();
  });

  it('should always call ack regardless of success or failure', async () => {
    jest.spyOn(SampleDataService, 'fetchSampleData').mockResolvedValue(fakeSlackResponse);

    await searchCallback(buildArguments({}));

    expect(fakeAck).toHaveBeenCalled();

    jest.clearAllMocks();

    jest.spyOn(SampleDataService, 'fetchSampleData').mockRejectedValue(new Error('Test error'));

    await searchCallback(buildArguments({}));

    expect(fakeAck).toHaveBeenCalled();
  });

  it('should pass correct search results to complete', async () => {
    jest.spyOn(SampleDataService, 'fetchSampleData').mockResolvedValue(fakeSlackResponse);

    await searchCallback(buildArguments({}));

    expect(fakeComplete).toHaveBeenCalledWith({
      outputs: {
        search_result: expect.arrayContaining([
          expect.objectContaining({
            title: expect.any(String),
            description: expect.any(String),
            link: expect.any(String),
          }),
        ]),
      },
    });
  });
});
