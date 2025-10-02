import type { FunctionInputs } from '@slack/bolt';

export interface UserContext {
  id: string;
  secret: string;
}

export interface EntityReference {
  id: string;
  type?: string;
}

export interface SearchResult {
  title: string;
  description: string;
  date_updated: string;
  external_ref: EntityReference;
  link: string;
  content?: string;
}

export interface SlackSampleDataResponse {
  ok: boolean;
  samples: SearchResult[];
}

export interface FilterOption {
  name: string;
  value: string;
}

export interface SearchFilter {
  name: string;
  display_name: string;
  type: string;
  options?: FilterOption[];
}

export interface SearchInputs extends FunctionInputs {
  query: string;
  filters: Record<string, boolean | string | string[]>;
  user_context: UserContext;
}

export interface FilterInputs extends FunctionInputs {
  user_context: UserContext;
}
