import assert from 'node:assert';
import { beforeEach, describe, it, mock } from 'node:test';
import type { AllMiddlewareArgs, SlackEventMiddlewareArgs } from '@slack/bolt';
import { entityDetailsRequestedCallback } from '../../../listeners/events/entity-details-requested.js';
import { SampleDataService, SlackResponseError } from '../../../listeners/sample-data-service.js';
import { fakeClient, fakeLogger, fakeSampleData, fakeSlackResponse } from '../../helpers.js';

const validEvent = {
  external_ref: { id: fakeSampleData[0].external_ref.id },
  trigger_id: 'trigger123',
  link: { url: 'https://github.com/slack-samples/bolt-js-getting-started' },
};

const mockFetchSampleData = mock.method(SampleDataService, 'fetchSampleData');

const buildArguments = ({
  client = fakeClient,
  event = validEvent,
  logger = fakeLogger,
}: {
  client?: typeof fakeClient;
  event?: Record<string, unknown>;
  logger?: typeof fakeLogger;
}): AllMiddlewareArgs & SlackEventMiddlewareArgs<'entity_details_requested'> => {
  return {
    client,
    event,
    logger,
  } as unknown as AllMiddlewareArgs & SlackEventMiddlewareArgs<'entity_details_requested'>;
};

describe('entityDetailsRequestedCallback', () => {
  beforeEach(() => {
    fakeClient.apiCall.mock.resetCalls();
    fakeLogger.resetCalls();
    mockFetchSampleData.mock.resetCalls();
    mockFetchSampleData.mock.mockImplementation(() => Promise.resolve(fakeSlackResponse));
    fakeClient.apiCall.mock.mockImplementation(() => Promise.resolve({ ok: true }));
  });

  it('should successfully process valid entity details requested event', async () => {
    await entityDetailsRequestedCallback(buildArguments({}));

    assert(mockFetchSampleData.mock.callCount() === 1);
    const fetchCallArgs = mockFetchSampleData.mock.calls[0].arguments[0];
    assert(fetchCallArgs.client);

    assert(fakeClient.apiCall.mock.callCount() === 1);
    assert.deepStrictEqual(fakeClient.apiCall.mock.calls[0].arguments[0], 'entity.presentDetails');
    assert.deepStrictEqual(fakeClient.apiCall.mock.calls[0].arguments[1], {
      trigger_id: validEvent.trigger_id,
      metadata: {
        entity_type: 'slack#/entities/item',
        url: validEvent.link.url,
        external_ref: validEvent.external_ref,
        entity_payload: {
          attributes: {
            title: {
              text: fakeSampleData[0].title,
              edit: {
                enabled: false,
                text: {
                  max_length: 50,
                },
              },
            },
          },
          custom_fields: [
            {
              key: 'description',
              label: 'Description of sample',
              type: 'string',
              value: fakeSampleData[0].description,
            },
            {
              key: 'date_updated',
              label: 'Last updated',
              type: 'string',
              value: fakeSampleData[0].date_updated,
            },
            {
              key: 'content',
              label: 'Details of sample',
              type: 'string',
              value: fakeSampleData[0].content,
            },
          ],
        },
      },
    });
  });

  it('should handle sample with missing content field', async () => {
    const eventForSampleWithoutContent = {
      external_ref: { id: fakeSampleData[2].external_ref.id },
      trigger_id: 'trigger123',
      link: { url: 'https://github.com/slack-samples/bolt-ts-starter' },
    };

    await entityDetailsRequestedCallback(buildArguments({ event: eventForSampleWithoutContent }));

    assert(fakeClient.apiCall.mock.callCount() === 1);
    assert.deepStrictEqual(fakeClient.apiCall.mock.calls[0].arguments[0], 'entity.presentDetails');
    assert.deepStrictEqual(fakeClient.apiCall.mock.calls[0].arguments[1], {
      trigger_id: eventForSampleWithoutContent.trigger_id,
      metadata: {
        entity_type: 'slack#/entities/item',
        url: eventForSampleWithoutContent.link.url,
        external_ref: eventForSampleWithoutContent.external_ref,
        entity_payload: {
          attributes: {
            title: {
              text: fakeSampleData[2].title,
              edit: {
                enabled: false,
                text: {
                  max_length: 50,
                },
              },
            },
          },
          custom_fields: [
            {
              key: 'description',
              label: 'Description of sample',
              type: 'string',
              value: fakeSampleData[2].description,
            },
            {
              key: 'date_updated',
              label: 'Last updated',
              type: 'string',
              value: fakeSampleData[2].date_updated,
            },
            // Note: No content field should be included
          ],
        },
      },
    });
  });

  it('should fail when event format is invalid', async () => {
    await entityDetailsRequestedCallback(
      buildArguments({
        event: {
          external_ref: null, // Invalid: should be object
          trigger_id: 123, // Invalid: should be string
          // Missing link field
        },
      }),
    );

    assert(fakeLogger.error.mock.callCount() === 1);
    assert(fakeLogger.error.mock.calls[0].arguments[0].includes('Invalid event format - received:'));
    assert(mockFetchSampleData.mock.callCount() === 0);
    assert(fakeClient.apiCall.mock.callCount() === 0);
  });

  it('should handle missing external_ref field', async () => {
    await entityDetailsRequestedCallback(
      buildArguments({
        event: {
          trigger_id: 'trigger123',
          link: { url: 'https://example.com' },
          // Missing external_ref
        },
      }),
    );

    assert(fakeLogger.error.mock.callCount() === 1);
    assert(fakeLogger.error.mock.calls[0].arguments[0].includes('Invalid event format - received:'));
    assert(mockFetchSampleData.mock.callCount() === 0);
  });

  it('should handle missing trigger_id field', async () => {
    await entityDetailsRequestedCallback(
      buildArguments({
        event: {
          external_ref: { id: 'bolt-js-getting-started' },
          link: { url: 'https://example.com' },
          // Missing trigger_id
        },
      }),
    );

    assert(fakeLogger.error.mock.callCount() === 1);
    assert(fakeLogger.error.mock.calls[0].arguments[0].includes('Invalid event format - received:'));
    assert(mockFetchSampleData.mock.callCount() === 0);
  });

  it('should handle missing link field', async () => {
    await entityDetailsRequestedCallback(
      buildArguments({
        event: {
          external_ref: { id: 'bolt-js-getting-started' },
          trigger_id: 'trigger123',
          // Missing link
        },
      }),
    );

    assert(fakeLogger.error.mock.callCount() === 1);
    assert(fakeLogger.error.mock.calls[0].arguments[0].includes('Invalid event format - received:'));
    assert(mockFetchSampleData.mock.callCount() === 0);
  });

  it('should handle sample not found in response', async () => {
    await entityDetailsRequestedCallback(
      buildArguments({
        event: {
          external_ref: { id: 'non-existent-sample' }, // invalid id
          trigger_id: 'trigger123',
          link: { url: 'https://example.com' },
        },
      }),
    );

    assert(mockFetchSampleData.mock.callCount() === 1);
    assert(fakeLogger.warn.mock.callCount() === 1);
    assert(
      fakeLogger.warn.mock.calls[0].arguments[0].includes(
        'Failed to find sample data with external reference id: non-existent-sample',
      ),
    );
    assert(fakeClient.apiCall.mock.callCount() === 0);
  });

  it('should handle SlackResponseError from fetchSampleData', async () => {
    mockFetchSampleData.mock.mockImplementation(() => {
      throw new SlackResponseError('Failed to fetch sample data from Slack API');
    });

    await entityDetailsRequestedCallback(buildArguments({}));

    assert(fakeLogger.error.mock.callCount() === 1);
    assert(
      fakeLogger.error.mock.calls[0].arguments[0].includes(
        'Failed to fetch or parse sample data. Error details: Failed to fetch sample data from Slack API',
      ),
    );
    assert(fakeClient.apiCall.mock.callCount() === 0);
  });

  it('should handle unexpected errors', async () => {
    mockFetchSampleData.mock.mockImplementation(() => {
      throw new TypeError('Unexpected error');
    });

    await entityDetailsRequestedCallback(buildArguments({ logger: fakeLogger }));

    assert(fakeLogger.error.mock.callCount() === 1);
    assert(
      fakeLogger.error.mock.calls[0].arguments[0].includes(
        'Unexpected error occurred while processing entity_details_requested event: Unexpected error',
      ),
    );
    assert(fakeClient.apiCall.mock.callCount() === 0);
  });

  it('should handle empty samples array', async () => {
    mockFetchSampleData.mock.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        samples: [],
      }),
    );

    await entityDetailsRequestedCallback(buildArguments({ logger: fakeLogger }));

    assert(fakeLogger.warn.mock.callCount() === 1);
    assert(
      fakeLogger.warn.mock.calls[0].arguments[0].includes(
        `Failed to find sample data with external reference id: ${validEvent.external_ref.id}`,
      ),
    );
    assert(fakeClient.apiCall.mock.callCount() === 0);
  });
});
