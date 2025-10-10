import { ErrorCode, type WebAPICallError } from '@slack/web-api';
import type { EntityReference, SearchResult, SlackSampleDataResponse } from './types.js';

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isArray<T>(value: unknown, itemGuard?: (item: unknown) => item is T): value is T[] {
  if (!Array.isArray(value)) {
    return false;
  }
  if (!itemGuard) {
    return true;
  }
  return value.every(itemGuard);
}

export function isWebAPICallError(error: unknown): error is WebAPICallError {
  if (!isObject(error)) {
    return false;
  }
  if (!('code' in error) || !isString(error.code)) {
    return false;
  }
  return Object.values(ErrorCode).includes(error.code as ErrorCode);
}

export function isEntityReference(data: unknown): data is EntityReference {
  if (!isObject(data)) {
    return false;
  }
  if (!('id' in data) || !isString(data.id)) {
    return false;
  }
  return true;
}

export function isSlackSampleDataResponse(data: unknown): data is SlackSampleDataResponse {
  if (!isObject(data)) {
    return false;
  }

  if (!('ok' in data) || !('samples' in data)) {
    return false;
  }

  if (!isBoolean(data.ok) || !isArray(data.samples, isSearchResult)) {
    return false;
  }

  return true;
}

function isSearchResult(data: unknown): data is SearchResult {
  if (!isObject(data)) {
    return false;
  }

  if (
    !('external_ref' in data) ||
    !('title' in data) ||
    !('description' in data) ||
    !('date_updated' in data) ||
    !('link' in data)
  ) {
    return false;
  }

  if (
    !isEntityReference(data.external_ref) ||
    !isString(data.title) ||
    !isString(data.description) ||
    !isString(data.date_updated) ||
    !isString(data.link)
  ) {
    return false;
  }

  if ('content' in data && !isString(data.content)) {
    return false;
  }

  return true;
}
