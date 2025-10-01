interface EntityReference {
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

export interface SlackApiResponse {
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
