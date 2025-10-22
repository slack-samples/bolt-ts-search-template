import type { Logger } from '@slack/bolt';
import type { WebClient } from '@slack/web-api';
import type { SAMPLES_FILTER, TEMPLATES_FILTER } from './functions/filters.js';

export type Filters = {
  languages?: string[];
  template?: boolean;
  sample?: boolean;
};

export interface EntityReference {
  id: string;
  type?: string;
}

export interface SlackSampleDataResponse {
  ok: boolean;
  samples: SearchResult[];
}

export interface SearchResult {
  title: string;
  description: string;
  date_updated: string;
  external_ref: EntityReference;
  link: string;
  content?: string;
}
export interface DeveloperSampleDataGetOptions extends Record<string, unknown> {
  query?: string;
  filters?: {
    languages?: string[];
    type?: typeof TEMPLATES_FILTER.name | typeof SAMPLES_FILTER.name;
  };
}

export interface FetchSampleDataOptions {
  client: WebClient;
  query?: string;
  filters?: Filters;
  logger: Logger;
}
