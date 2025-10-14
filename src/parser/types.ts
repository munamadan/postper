import { HttpMethod } from '../types/common';

export interface ParsedRequest {
  id: string;
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
  | { success: true; requests: ParsedRequest[] }
  | { success: false; errors: ParseError[] };