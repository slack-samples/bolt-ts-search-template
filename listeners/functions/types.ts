import type { FunctionInputs } from '@slack/bolt';
import type { Filters } from '../types';

export interface UserContext {
  id: string;
  secret: string;
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
  filters: Filters;
  user_context: UserContext;
}

export interface FilterInputs extends FunctionInputs {
  user_context: UserContext;
}
