import type { AckFn, AllMiddlewareArgs, Logger, SlackEventMiddlewareArgs } from '@slack/bolt';
import type { WebClient } from '@slack/web-api';
import searchCallback, { SearchService, SlackResponseError } from '../../listeners/functions/search';
import type { SearchResult, SlackSampleDataResponse } from '../../listeners/functions/types';

// Mock dependencies
const mockLogger: Logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  setLevel: jest.fn(),
  getLevel: jest.fn(),
  setName: jest.fn(),
};

const mockClient: WebClient = {} as WebClient;

const mockAck = jest.fn();
const mockFail = jest.fn();
const mockComplete = jest.fn();

// Mock sample data
const mockSampleData: SearchResult[] = [
  {
    title: 'JavaScript Getting Started',
    description: 'A template for building Slack apps with Bolt for JavaScript.',
    link: 'https://github.com/slack-samples/bolt-js-getting-started',
    date_updated: '2025-01-01',
    external_ref: { id: 'bolt-js-getting-started' },
    content: 'This quickstart guide helps you get a Slack app using Bolt for JavaScript up and running.',
  },
  {
    title: 'Python AI Assistant',
    description: 'A template for building AI-enabled apps with Bolt for Python.',
    link: 'https://github.com/slack-samples/bolt-python-assistant',
    date_updated: '2025-01-02',
    external_ref: { id: 'bolt-python-assistant' },
    content: 'Create an AI assistant using Python and machine learning capabilities.',
  },
  {
    title: 'TypeScript Starter',
    description: 'A starter template for TypeScript Slack apps.',
    link: 'https://github.com/slack-samples/bolt-ts-starter',
    date_updated: '2025-01-03',
    external_ref: { id: 'bolt-ts-starter' },
  },
];

const mockSlackResponse: SlackSampleDataResponse = {
  ok: true,
  samples: mockSampleData,
};

const validInputs = {
  query: 'javascript',
  filters: { language: 'javascript', type: 'template' },
  user_context: { id: 'U123456', secret: 'secret123' },
};

const buildArguments = ({
  ack = mockAck,
  inputs = validInputs,
  fail = mockFail,
  complete = mockComplete,
  client = mockClient,
  logger = mockLogger,
}: {
  ack?: AckFn<void>;
  inputs?: Record<string, unknown>;
  fail?: typeof mockFail;
  complete?: typeof mockComplete;
  client?: WebClient;
  logger?: Logger;
}): AllMiddlewareArgs & SlackEventMiddlewareArgs<'function_executed'> => {
  return {
    ack: ack,
    inputs: inputs,
    fail: fail,
    complete: complete,
    client: client,
    logger: logger,
  } as unknown as AllMiddlewareArgs & SlackEventMiddlewareArgs<'function_executed'>;
};

describe('SearchService', () => {
  describe('fuzzySearch', () => {
    it('should return matching results for a query', async () => {
      const results = await SearchService.fuzzySearch({
        query: 'python',
        samples: mockSampleData,
      });

      expect(results).toHaveLength(1);
      expect(results[0]).toBe(mockSampleData[1]);
    });

    it('should return multiple results for broader queries', async () => {
      const results = await SearchService.fuzzySearch({
        query: 'template',
        samples: mockSampleData,
      });

      expect(results.length).toBeGreaterThan(1);
      expect(results.some((r) => r.title.includes('JavaScript'))).toBe(true);
      expect(results.some((r) => r.title.includes('Python'))).toBe(true);
    });

    it('should return empty array for no matches', async () => {
      const results = await SearchService.fuzzySearch({
        query: 'nonexistentquery12345',
        samples: mockSampleData,
      });

      expect(results).toHaveLength(0);
    });

    it('should handle empty samples array', async () => {
      const results = await SearchService.fuzzySearch({
        query: 'javascript',
        samples: [],
      });

      expect(results).toHaveLength(0);
    });
  });
});

describe('searchCallback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully process valid search inputs', async () => {
    jest.spyOn(SearchService, 'fetchSampleData').mockResolvedValue(mockSlackResponse);

    await searchCallback(buildArguments({}));

    expect(SearchService.fetchSampleData).toHaveBeenCalledWith({
      client: mockClient,
      filters: validInputs.filters,
      logger: mockLogger,
    });

    expect(mockComplete).toHaveBeenCalledWith({
      outputs: {
        search_result: expect.any(Array),
      },
    });

    expect(mockAck).toHaveBeenCalled();
    expect(mockFail).not.toHaveBeenCalled();
  });

  it('should fail when inputs are invalid', async () => {
    const invalidInputs = {
      query: 123, // Invalid: should be string
      filters: 'invalid', // Invalid: should be object
      user_context: null, // Invalid: should be object
    };

    await searchCallback(buildArguments({ inputs: invalidInputs }));

    expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('Invalid search inputs provided'));
    expect(mockFail).toHaveBeenCalledWith({
      error: SearchService.SEARCH_PROCESSING_ERROR_MSG,
    });
    expect(mockComplete).not.toHaveBeenCalled();
    expect(mockAck).toHaveBeenCalled();
  });

  it('should handle missing query field', async () => {
    const inputsWithoutQuery = {
      filters: { language: 'javascript' },
      user_context: { id: 'U123456', secret: 'secret123' },
    };

    await searchCallback(buildArguments({ inputs: inputsWithoutQuery }));

    expect(mockFail).toHaveBeenCalled();
    expect(mockComplete).not.toHaveBeenCalled();
  });

  it('should handle SlackResponseError from fetchSampleData', async () => {
    const fakeResponseError = new SlackResponseError('Failed to fetch sample data from Slack API');

    jest.spyOn(SearchService, 'fetchSampleData').mockRejectedValue(fakeResponseError);

    await searchCallback(buildArguments({}));

    expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('Failed to fetch or parse sample data'));
    expect(mockFail).toHaveBeenCalledWith({
      error: SearchService.SEARCH_PROCESSING_ERROR_MSG,
    });
    expect(mockComplete).not.toHaveBeenCalled();
    expect(mockAck).toHaveBeenCalled();
  });

  it('should handle unexpected errors', async () => {
    const unexpectedError = new TypeError('Unexpected error');

    jest.spyOn(SearchService, 'fetchSampleData').mockRejectedValue(unexpectedError);

    await searchCallback(buildArguments({}));

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Unexpected error occurred while processing search request'),
    );
    expect(mockFail).toHaveBeenCalledWith({
      error: SearchService.SEARCH_PROCESSING_ERROR_MSG,
    });
    expect(mockAck).toHaveBeenCalled();
  });

  it('should log user search activity', async () => {
    jest.spyOn(SearchService, 'fetchSampleData').mockResolvedValue(mockSlackResponse);

    await searchCallback(buildArguments({}));

    expect(mockLogger.debug).toHaveBeenCalledWith(
      expect.stringContaining(`User ${validInputs.user_context.id} executing search query: "${validInputs.query}"`),
    );
  });

  it('should always call ack regardless of success or failure', async () => {
    jest.spyOn(SearchService, 'fetchSampleData').mockResolvedValue(mockSlackResponse);

    await searchCallback(buildArguments({}));

    expect(mockAck).toHaveBeenCalled();

    jest.clearAllMocks();

    jest.spyOn(SearchService, 'fetchSampleData').mockRejectedValue(new Error('Test error'));

    await searchCallback(buildArguments({}));

    expect(mockAck).toHaveBeenCalled();
  });

  it('should pass correct search results to complete', async () => {
    jest.spyOn(SearchService, 'fetchSampleData').mockResolvedValue(mockSlackResponse);

    await searchCallback(buildArguments({}));

    expect(mockComplete).toHaveBeenCalledWith({
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
