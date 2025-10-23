import assert from 'node:assert';
import { describe, it } from 'node:test';
import { isEntityDetailsRequestedEvent } from '../../../listeners/events/type-guards.js';

describe('isEntityDetailsRequestedEvent', () => {
  it('should return true for valid EntityDetailsRequestedEvent objects', () => {
    assert(
      isEntityDetailsRequestedEvent({
        external_ref: {
          id: 'ref123',
          type: 'sample',
        },
        trigger_id: 'trigger123',
        link: {
          url: 'https://example.com',
        },
      }),
    );
  });

  it('should return false for objects missing required properties', () => {
    const missingExternalRef = {
      trigger_id: 'trigger123',
      link: {
        url: 'https://example.com',
      },
    };
    assert(!isEntityDetailsRequestedEvent(missingExternalRef));

    const missingTriggerId = {
      external_ref: {
        id: 'ref123',
      },
      link: {
        url: 'https://example.com',
      },
    };
    assert(!isEntityDetailsRequestedEvent(missingTriggerId));

    const missingLink = {
      external_ref: {
        id: 'ref123',
      },
      trigger_id: 'trigger123',
    };
    assert(!isEntityDetailsRequestedEvent(missingLink));
  });

  it('should return false for objects with invalid property types', () => {
    const invalidExternalRef = {
      external_ref: 'not-an-object',
      trigger_id: 'trigger123',
      link: {
        url: 'https://example.com',
      },
    };
    assert(!isEntityDetailsRequestedEvent(invalidExternalRef));

    const invalidTriggerId = {
      external_ref: {
        id: 'ref123',
      },
      trigger_id: 123,
      link: {
        url: 'https://example.com',
      },
    };
    assert(!isEntityDetailsRequestedEvent(invalidTriggerId));

    const invalidLink = {
      external_ref: {
        id: 'ref123',
      },
      trigger_id: 'trigger123',
      link: 'not-an-object',
    };
    assert(!isEntityDetailsRequestedEvent(invalidLink));
  });

  it('should return false for invalid link objects', () => {
    const missingUrl = {
      external_ref: {
        id: 'ref123',
      },
      trigger_id: 'trigger123',
      link: {},
    };
    assert(!isEntityDetailsRequestedEvent(missingUrl));

    const invalidUrlType = {
      external_ref: {
        id: 'ref123',
      },
      trigger_id: 'trigger123',
      link: {
        url: 123,
      },
    };
    assert(!isEntityDetailsRequestedEvent(invalidUrlType));
  });

  it('should return false for non-object values', () => {
    assert(!isEntityDetailsRequestedEvent(null));
    assert(!isEntityDetailsRequestedEvent(undefined));
    assert(!isEntityDetailsRequestedEvent('string'));
    assert(!isEntityDetailsRequestedEvent(123));
    assert(!isEntityDetailsRequestedEvent(true));
    assert(!isEntityDetailsRequestedEvent([]));
  });
});
