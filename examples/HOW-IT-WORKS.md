# How POSTPER Works

Understanding the internals of the POSTPER HTTP client.

## Architecture
```
┌─────────────────┐
│  .http File     │
│  (Your Request) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  HTTP Parser    │──► Syntax validation
│                 │──► Extract method, URL, headers, body
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Variable       │──► Resolve {{VARIABLES}}
│  Resolver       │──► Chain variables (response.body.x)
│                 │──► Environment variables (.env)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  HTTP Client    │──► Execute request (Axios)
│                 │──► Handle multipart/form-data
│                 │──► File uploads
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Response       │──► Format JSON/XML/HTML
│  Formatter      │──► Syntax highlighting
│                 │──► Display in WebView panel
└─────────────────┘
```

## Request Parsing

When you click "Send Request":

1. **CodeLens detects** the request at cursor position
2. **Parser extracts**:
   - HTTP method (GET, POST, etc.)
   - URL
   - Headers (Key: Value pairs)
   - Body (after blank line)
3. **Validator checks**:
   - Valid HTTP method
   - Valid URL format
   - No body on GET/HEAD
   - No duplicate headers

## Variable Resolution

Variables are resolved in this order:

### 1. Chain Variables (First)
```http
# @name login
POST /auth/login
{"user": "test"}

###

# Uses response from 'login' request
GET /data?token={{login.response.body.token}}
```

**How it works:**
- Responses saved in memory with @name
- `{{name.response.body.path}}` extracts data
- Supports nested properties and arrays

### 2. Environment Variables (Second)
```
# .env file
BASE_URL=https://api.example.com
```
```http
GET {{BASE_URL}}/users
```

**How it works:**
- `.env` files parsed on activation
- `{{VARIABLE}}` replaced with values
- Nested variables supported

## File Uploads

Multipart requests are handled specially:

1. **Parser detects** `Content-Type: multipart/form-data`
2. **Multipart parser**:
   - Splits by boundary
   - Extracts form fields
   - Detects file references (`< path`)
3. **File reader**:
   - Reads file from disk
   - Detects MIME type
   - Creates buffer
4. **FormData builder**:
   - Constructs multipart body
   - Sets correct headers
   - Sends to server

## Response Display

Responses are formatted based on Content-Type:
```javascript
if (contentType.includes('json')) {
  // Pretty-print JSON with 2-space indent
  formatted = JSON.stringify(parsed, null, 2)
} else if (contentType.includes('xml')) {
  // Format XML with indentation
  formatted = formatXML(body)
} else {
  // Plain text
  formatted = body
}
```

## State Management

POSTPER maintains state in memory:

- **Environment variables**: Loaded from `.env` files
- **Saved responses**: Stored by @name
- **Active requests**: Tracked for cancellation

State persists during VS Code session but is cleared on reload.

## Security

- **No data sent to servers** except your API
- **Credentials in .env** files (gitignored)
- **No telemetry** or analytics
- **Open source** - audit the code yourself

## Performance

- **Parser**: 1000 requests in <20ms
- **Variable resolution**: <5ms per request
- **File reading**: Async, non-blocking
- **Response display**: Lazy rendering for large bodies

## Tech Stack

- **Language**: TypeScript
- **HTTP Client**: Axios
- **Parser**: Custom state machine
- **UI**: VS Code WebView API
- **Testing**: Jest (144 tests, 91% coverage)

## File Types

POSTPER recognizes these files:

- `.http` - Primary format
- `.rest` - Alternative format

Both work identically!

## Contributing

Want to improve POSTPER?

1. Fork the repo
3. Submit a pull request

---

**Built by Dipan Kharel**