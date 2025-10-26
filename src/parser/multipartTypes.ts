export interface MultipartPart {
  name: string;
  filename?: string;
  contentType?: string;
  value?: string;
  filePath?: string; // Path to file to upload
}

export interface MultipartRequest {
  boundary: string;
  parts: MultipartPart[];
}

export interface ParseMultipartResult {
  success: boolean;
  multipart?: MultipartRequest;
  error?: string;
}
