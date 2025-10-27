export interface SavedResponse {
  name: string;
  status: number;
  headers: Map<string, string>;
  body: any; // Parsed JSON or string
  rawBody: Buffer;
  timestamp: number;
}

export interface RequestChainContext {
  responses: Map<string, SavedResponse>;
}
