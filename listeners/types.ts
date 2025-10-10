export interface Filters {
  languages?: string[];
  type?: string[];
}

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
