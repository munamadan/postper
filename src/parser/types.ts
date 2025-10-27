import { HttpMethod } from '../types/common';

export interface ParsedRequest {
  id: string;
  name?: string;
  method: HttpMethod;
  url: string;
  headers: Map<string, string>;
  body?: string;
  lineNumber: number;
}

export interface ParseError {
  message: string;
  lineNumber: number;
  column?: number;
}

export type ParseResult =
  | { success: true; requests: ParsedRequest[]; errors?: ParseError[] }
  | { success: false; requests: ParsedRequest[]; errors: ParseError[] };
