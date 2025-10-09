import type { FunctionInputs } from '@slack/bolt';
import { isObject, isString } from '../type-guards.js';
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
