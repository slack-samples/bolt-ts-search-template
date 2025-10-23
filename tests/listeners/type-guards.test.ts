import assert from 'node:assert';
import { describe, it } from 'node:test';
import { ErrorCode } from '@slack/web-api';
import {
  isBoolean,
  isEntityReference,
  isObject,
  isSlackSampleDataResponse,
  isString,
  isWebAPICallError,
} from '../../listeners/type-guards.js';
import type { EntityReference, SlackSampleDataResponse } from '../../listeners/types.js';
import { fakeSampleData } from '../helpers.js';

describe('isString', () => {
  it('should return true for valid strings', () => {
    assert(isString('hello'));
  });

  it('should return false for non-string values', () => {
    assert(!isString(123));
    assert(!isString(true));
    assert(!isString(null));
    assert(!isString(undefined));
    assert(!isString({}));
    assert(!isString([]));
    assert(!isString(() => {}));
  });
});

describe('isObject', () => {
  it('should return true for valid objects', () => {
    assert(isObject({}));
    assert(isObject({ key: 'value' }));
    assert(isObject(new Date()));
  });

  it('should return false for non-object values', () => {
    assert(!isObject(null));
    assert(!isObject(undefined));
    assert(!isObject('string'));
    assert(!isObject(123));
    assert(!isObject(true));
    assert(!isObject(() => {}));
    assert(!isObject([]));
  });
});

describe('isBoolean', () => {
  it('should return true for valid boolean values', () => {
    assert(isBoolean(true));
    assert(isBoolean(false));
  });

  it('should return false for non-boolean values', () => {
    assert(!isBoolean('true'));
    assert(!isBoolean(1));
    assert(!isBoolean(0));
    assert(!isBoolean(null));
    assert(!isBoolean(undefined));
    assert(!isBoolean({}));
    assert(!isBoolean([]));
    assert(!isBoolean(() => {}));
  });
});

describe('isWebAPICallError', () => {
  it('should return true for valid WebAPICallError objects', () => {
    const validError = {
      code: ErrorCode.PlatformError,
      message: 'Something went wrong',
    };
    assert(isWebAPICallError(validError));
  });

  it('should return false for objects without code property', () => {
    const errorWithoutCode = {
      message: 'Something went wrong',
    };
    assert(!isWebAPICallError(errorWithoutCode));
  });

  it('should return false for objects with invalid code', () => {
    const errorWithInvalidCode = {
      code: 'invalid_code',
      message: 'Something went wrong',
    };
    assert(!isWebAPICallError(errorWithInvalidCode));
  });
});

describe('isEntityReference', () => {
  it('should return true for valid EntityReference objects', () => {
    const validEntity: EntityReference = {
      id: 'entity123',
    };
    assert(isEntityReference(validEntity));

    const entityWithType: EntityReference = {
      id: 'entity456',
      type: 'template',
    };
    assert(isEntityReference(entityWithType));
  });

  it('should return false for objects invalid id property', () => {
    assert(
      !isEntityReference({
        type: 'template',
      }),
    );
    assert(
      !isEntityReference({
        id: 123,
        type: 'template',
      }),
    );

    assert(
      !isEntityReference({
        id: null,
        type: 'template',
      }),
    );
  });
});

describe('isSlackSampleDataResponse', () => {
  it('should return true for valid SlackSampleDataResponse objects', () => {
    const responseWithMultipleSamples: SlackSampleDataResponse = {
      ok: true,
      samples: fakeSampleData,
    };
    assert(isSlackSampleDataResponse(responseWithMultipleSamples));

    const responseWithEmptySamples: SlackSampleDataResponse = {
      ok: false,
      samples: [],
    };
    assert(isSlackSampleDataResponse(responseWithEmptySamples));
  });

  it('should return false for objects without ok property', () => {
    const responseWithoutOk = {
      samples: fakeSampleData,
    };
    assert(!isSlackSampleDataResponse(responseWithoutOk));
  });

  it('should return false for objects without samples property', () => {
    const responseWithoutSamples = {
      ok: true,
    };
    assert(!isSlackSampleDataResponse(responseWithoutSamples));
  });

  it('should return false for objects with invalid ok value', () => {
    const responseWithInvalidOk = {
      ok: 'true', // Should be boolean
      samples: fakeSampleData,
    };
    assert(!isSlackSampleDataResponse(responseWithInvalidOk));

    const responseWithNullOk = {
      ok: null,
      samples: fakeSampleData,
    };
    assert(!isSlackSampleDataResponse(responseWithNullOk));
  });

  it('should return false for objects with invalid samples array', () => {
    assert(
      !isSlackSampleDataResponse({
        ok: true,
        samples: 'not an array',
      }),
    );

    assert(
      !isSlackSampleDataResponse({
        ok: true,
        samples: [
          { invalid: 'sample' }, // Invalid sample
        ],
      }),
    );
  });

  it('should validate SearchResult structure within samples', () => {
    assert(
      !isSlackSampleDataResponse({
        ok: true,
        samples: [
          {
            // Missing title, description, date_updated, external_ref, link
            content: 'Some content',
          },
        ],
      }),
    );
  });
});
