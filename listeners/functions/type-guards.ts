import type { FunctionInputs } from '@slack/bolt';
import type {
  EntityReference,
  FilterInputs,
  SearchInputs,
  SearchResult,
  SlackSampleDataResponse,
  UserContext,
} from './types';

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null;
}

function isArray<T>(value: unknown, itemGuard?: (item: unknown) => item is T): value is T[] {
  if (!Array.isArray(value)) {
    return false;
  }
  if (!itemGuard) {
    return true;
  }
  return value.every(itemGuard);
}

export function isUserContext(data: unknown): data is UserContext {
  if (!isObject(data)) {
    return false;
  }
  if (!('id' in data) || !('secret' in data)) {
    return false;
  }
  if (!isString(data.id) || !isString(data.secret)) {
    return false;
  }
  return true;
}

export function isSearchInputs(inputs: FunctionInputs): inputs is SearchInputs {
  if (!isString(inputs.query) || !isObject(inputs.filters) || !isUserContext(inputs.user_context)) {
    return false;
  }
  return true;
}

export function isFilterInputs(inputs: FunctionInputs): inputs is FilterInputs {
  if (!isUserContext(inputs.user_context)) {
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

function isEntityReference(data: unknown): data is EntityReference {
  if (!isObject(data)) {
    return false;
  }
  if (!('id' in data) || !isString(data.id)) {
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
