import { isEntityReference, isObject, isString } from '../type-guards.js';
import type { EntityDetailsRequestedEvent, Link } from './types.js';

function isLink(data: unknown): data is Link {
  if (!isObject(data)) {
    return false;
  }
  if (!('url' in data) || !isString(data.url)) {
    return false;
  }
  return true;
}

export function isEntityDetailsRequestedEvent(data: unknown): data is EntityDetailsRequestedEvent {
  if (!isObject(data)) {
    return false;
  }
  if (!('external_ref' in data) || !('trigger_id' in data) || !('link' in data)) {
    return false;
  }
  if (!isEntityReference(data.external_ref) || !isString(data.trigger_id) || !isLink(data.link)) {
    return false;
  }
  return true;
}
