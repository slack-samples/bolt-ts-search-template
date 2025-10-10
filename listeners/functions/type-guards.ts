import type { FunctionInputs } from '@slack/bolt';
import { isArray, isObject, isString } from '../type-guards.js';
import type { Filters } from '../types.js';
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

  if ('languages' in data && !isArray(data.languages, isString)) {
    return false;
  }

  if ('type' in data && !isArray(data.type, isString)) {
    return false;
  }

  return true;
}
