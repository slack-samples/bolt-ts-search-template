import type { EntityReference } from '../types';

export interface Link {
  url: string;
}

export interface EntityDetailsRequestedEvent {
  external_ref: EntityReference;
  trigger_id: string;
  link: Link;
}
