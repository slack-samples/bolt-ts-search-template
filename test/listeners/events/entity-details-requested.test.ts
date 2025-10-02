import type { AllMiddlewareArgs, Logger, SlackEventMiddlewareArgs } from '@slack/bolt';
import type { WebClient } from '@slack/web-api';
import entityDetailsRequestedCallback from '../../../listeners/events/entity-details-requested';
import { SampleDataService, SlackResponseError } from '../../../listeners/sample-data-fetcher';
import type { SlackSampleDataResponse } from '../../../listeners/types';
import { fakeClient, fakeLogger, fakeSampleData, fakeSlackResponse } from '../../helpers';

const validEvent = {
  external_ref: { id: fakeSampleData[0].external_ref.id },
  trigger_id: 'trigger123',
  link: { url: 'https://github.com/slack-samples/bolt-js-getting-started' },
};

const buildArguments = ({
  client = fakeClient,
  event = validEvent,
  logger = fakeLogger,
}: {
  client?: WebClient;
  event?: Record<string, unknown>;
  logger?: Logger;
}): AllMiddlewareArgs & SlackEventMiddlewareArgs<'entity_details_requested'> => {
  return {
    client,
    event,
    logger,
  } as unknown as AllMiddlewareArgs & SlackEventMiddlewareArgs<'entity_details_requested'>;
};

describe('entityDetailsRequestedCallback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock the apiCall method
    fakeClient.apiCall = jest.fn().mockResolvedValue({ ok: true });
  });

  it('should successfully process valid entity details requested event', async () => {
    jest.spyOn(SampleDataService, 'fetchSampleData').mockResolvedValue(fakeSlackResponse);

    await entityDetailsRequestedCallback(buildArguments({}));

    expect(SampleDataService.fetchSampleData).toHaveBeenCalledWith({
      client: fakeClient,
      logger: fakeLogger,
    });

    expect(fakeClient.apiCall).toHaveBeenCalledWith('entity.presentDetails', {
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

    jest.spyOn(SampleDataService, 'fetchSampleData').mockResolvedValue(fakeSlackResponse);

    await entityDetailsRequestedCallback(buildArguments({ event: eventForSampleWithoutContent }));

    expect(fakeClient.apiCall).toHaveBeenCalledWith('entity.presentDetails', {
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
    const invalidEvent = {
      external_ref: null, // Invalid: should be object
      trigger_id: 123, // Invalid: should be string
      // Missing link field
    };

    await entityDetailsRequestedCallback(buildArguments({ event: invalidEvent }));

    expect(fakeLogger.error).toHaveBeenCalledWith(expect.stringContaining('Invalid event format - received:'));
    expect(SampleDataService.fetchSampleData).not.toHaveBeenCalled();
    expect(fakeClient.apiCall).not.toHaveBeenCalled();
  });

  it('should handle missing external_ref field', async () => {
    const eventWithoutExternalRef = {
      trigger_id: 'trigger123',
      link: { url: 'https://example.com' },
      // Missing external_ref
    };

    await entityDetailsRequestedCallback(buildArguments({ event: eventWithoutExternalRef }));

    expect(fakeLogger.error).toHaveBeenCalledWith(expect.stringContaining('Invalid event format - received:'));
    expect(SampleDataService.fetchSampleData).not.toHaveBeenCalled();
  });

  it('should handle missing trigger_id field', async () => {
    const eventWithoutTriggerId = {
      external_ref: { id: 'bolt-js-getting-started' },
      link: { url: 'https://example.com' },
      // Missing trigger_id
    };

    await entityDetailsRequestedCallback(buildArguments({ event: eventWithoutTriggerId }));

    expect(fakeLogger.error).toHaveBeenCalledWith(expect.stringContaining('Invalid event format - received:'));
    expect(SampleDataService.fetchSampleData).not.toHaveBeenCalled();
  });

  it('should handle missing link field', async () => {
    const eventWithoutLink = {
      external_ref: { id: 'bolt-js-getting-started' },
      trigger_id: 'trigger123',
      // Missing link
    };

    await entityDetailsRequestedCallback(buildArguments({ event: eventWithoutLink }));

    expect(fakeLogger.error).toHaveBeenCalledWith(expect.stringContaining('Invalid event format - received:'));
    expect(SampleDataService.fetchSampleData).not.toHaveBeenCalled();
  });

  it('should handle sample not found in response', async () => {
    const eventForNonExistentSample = {
      external_ref: { id: 'non-existent-sample' },
      trigger_id: 'trigger123',
      link: { url: 'https://example.com' },
    };

    jest.spyOn(SampleDataService, 'fetchSampleData').mockResolvedValue(fakeSlackResponse);

    await entityDetailsRequestedCallback(buildArguments({ event: eventForNonExistentSample }));

    expect(SampleDataService.fetchSampleData).toHaveBeenCalled();
    expect(fakeLogger.error).toHaveBeenCalledWith(
      'Failed to find sample data with external reference id: non-existent-sample',
    );
    expect(fakeClient.apiCall).not.toHaveBeenCalled();
  });

  it('should handle SlackResponseError from fetchSampleData', async () => {
    const slackError = new SlackResponseError('Failed to fetch sample data from Slack API');

    jest.spyOn(SampleDataService, 'fetchSampleData').mockRejectedValue(slackError);

    await entityDetailsRequestedCallback(buildArguments({}));

    expect(fakeLogger.error).toHaveBeenCalledWith(
      expect.stringContaining(
        'Failed to fetch or parse sample data. Error details: Failed to fetch sample data from Slack API',
      ),
    );
    expect(fakeClient.apiCall).not.toHaveBeenCalled();
  });

  it('should handle unexpected errors', async () => {
    const unexpectedError = new TypeError('Unexpected error');

    jest.spyOn(SampleDataService, 'fetchSampleData').mockRejectedValue(unexpectedError);

    await entityDetailsRequestedCallback(buildArguments({}));

    expect(fakeLogger.error).toHaveBeenCalledWith(
      expect.stringContaining(
        'Unexpected error occurred while processing entity_details_requested event: Unexpected error',
      ),
    );
    expect(fakeClient.apiCall).not.toHaveBeenCalled();
  });

  it('should handle empty samples array', async () => {
    const emptyResponse: SlackSampleDataResponse = {
      ok: true,
      samples: [],
    };

    jest.spyOn(SampleDataService, 'fetchSampleData').mockResolvedValue(emptyResponse);

    await entityDetailsRequestedCallback(buildArguments({}));

    expect(fakeLogger.error).toHaveBeenCalledWith(
      `Failed to find sample data with external reference id: ${validEvent.external_ref.id}`,
    );
    expect(fakeClient.apiCall).not.toHaveBeenCalled();
  });
});
