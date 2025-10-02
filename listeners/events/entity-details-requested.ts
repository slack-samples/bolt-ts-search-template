import type { AllMiddlewareArgs, SlackEventMiddlewareArgs } from '@slack/bolt';
import { SampleDataService, SlackResponseError } from '../sample-data-fetcher';
import { isEntityDetailsRequestedEvent } from './type-guards';

async function entityDetailsRequestedCallback({
  client,
  event,
  logger,
}: AllMiddlewareArgs & SlackEventMiddlewareArgs<'entity_details_requested'>) {
  if (!isEntityDetailsRequestedEvent(event)) {
    logger.error(`Invalid event format - received: ${JSON.stringify(event)}`);
    return;
  }

  try {
    const response = await SampleDataService.fetchSampleData({ client, logger });

    const sample = response.samples.find((sample) => sample.external_ref.id === event.external_ref.id);
    if (sample === undefined) {
      logger.error(`Failed to find sample data with external reference id: ${event.external_ref.id}`);
      return;
    }

    const customFields = [
      {
        key: 'description',
        label: 'Description of sample',
        type: 'string',
        value: sample.description,
      },
      {
        key: 'date_updated',
        label: 'Last updated',
        type: 'string',
        value: sample.date_updated,
      },
    ];
    if ('content' in sample && sample.content) {
      customFields.push({
        key: 'content',
        label: 'Details of sample',
        type: 'string',
        value: sample.content,
      });
    }

    client.apiCall('entity.presentDetails', {
      trigger_id: event.trigger_id,
      metadata: {
        entity_type: 'slack#/entities/item',
        url: event.link.url,
        external_ref: event.external_ref,
        entity_payload: {
          attributes: {
            title: {
              text: sample.title,
              edit: {
                enabled: false,
                text: {
                  max_length: 50,
                },
              },
            },
          },
          custom_fields: customFields,
        },
      },
    });
  } catch (error) {
    if (error instanceof SlackResponseError) {
      logger.error(`Failed to fetch or parse sample data. Error details: ${error.message}`);
    } else {
      logger.error(
        `Unexpected error occurred while processing entity_details_requested event: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}

export default entityDetailsRequestedCallback;
