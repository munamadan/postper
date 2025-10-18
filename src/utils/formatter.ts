export type FormatType = 'json' | 'xml' | 'html' | 'text';

export class ResponseFormatter {
  detectContentType(contentType: string): FormatType {
    const lower = contentType.toLowerCase();

    if (lower.includes('application/json') || lower.includes('text/json')) {
      return 'json';
    }
    if (lower.includes('application/xml') || lower.includes('text/xml')) {
      return 'xml';
    }
    if (lower.includes('text/html')) {
      return 'html';
    }
    return 'text';
  }

  format(body: string, type: FormatType): string {
    try {
      switch (type) {
        case 'json':
          return this.formatJson(body);
        case 'xml':
          return this.formatXml(body);
        case 'html':
          return this.formatHtml(body);
        default:
          return body;
      }
    } catch (error) {
      // If formatting fails, return original
      return body;
    }
  }

  private formatJson(body: string): string {
    try {
      const parsed = JSON.parse(body);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return body;
    }
  }

  private formatXml(body: string): string {
    // Simple XML formatting
    let formatted = '';
    let indent = 0;
    const lines = body.split(/>\s*</);

    lines.forEach((line, index) => {
      if (index > 0) {
        line = '<' + line;
      }
      if (index < lines.length - 1) {
        line = line + '>';
      }

      // Decrease indent for closing tags
      if (line.match(/^<\/\w/)) {
        indent = Math.max(0, indent - 2);
      }

      formatted += ' '.repeat(indent) + line.trim() + '\n';

      // Increase indent for opening tags
      if (line.match(/^<\w[^>]*[^\/]>$/)) {
        indent += 2;
      }
    });

    return formatted.trim();
  }

  private formatHtml(body: string): string {
    // Basic HTML formatting (similar to XML)
    return this.formatXml(body);
  }

  truncate(text: string, maxLength: number = 50000): { text: string; truncated: boolean } {
    if (text.length <= maxLength) {
      return { text, truncated: false };
    }
    return {
      text: text.substring(0, maxLength) + '\n\n... (truncated)',
      truncated: true,
    };
  }
}

export const responseFormatter = new ResponseFormatter();