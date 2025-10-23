import type { FunctionInputs } from '@slack/bolt';
import { isArray, isBoolean, isObject, isString } from '../type-guards.js';
import type { Filters } from '../types.js';
import { LANGUAGES_FILTER, SAMPLES_FILTER, TEMPLATES_FILTER } from './filters.js';
import type { FilterInputs, SearchInputs, UserContext } from './types.js';

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
  if (!isString(inputs.query) || !isFilters(inputs.filters) || !isUserContext(inputs.user_context)) {
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

function isFilters(data: unknown): data is Filters {
  if (!isObject(data)) {
    return false;
  }

  if (LANGUAGES_FILTER.name in data && !isArray(data[LANGUAGES_FILTER.name], isString)) {
    return false;
  }

  if (SAMPLES_FILTER.name in data && !isBoolean(data[SAMPLES_FILTER.name])) {
    return false;
  }

  if (TEMPLATES_FILTER.name in data && !isBoolean(data[TEMPLATES_FILTER.name])) {
    return false;
  }

  return true;
}
