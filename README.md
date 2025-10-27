# POSTPER

Execute HTTP requests directly from `.http` files in Visual Studio Code. A lightweight, text-based alternative to Postman with support for environment variables, request chaining, and file uploads.

## ✨ Features

- 📝 **Text-based HTTP requests** - Write requests in simple `.http` files
- 🔗 **Request chaining** - Use responses from previous requests
- 🌍 **Environment variables** - Switch between dev/prod/test environments
- 📤 **File uploads** - Support for multipart/form-data
- 🎨 **Syntax highlighting** - Beautiful HTTP syntax coloring
- 💾 **Version control friendly** - Plain text files work with Git
- 🚀 **Fast and lightweight** - No heavy GUI, just your editor

## 📦 Installation

1. Open VS Code
2. Press `Ctrl+P` (or `Cmd+P` on Mac)
3. Type: `ext install dipankharel.postper`
4. Press Enter

Or search for "POSTPER" in the Extensions view (`Ctrl+Shift+X`).

## 🚀 Quick Start

### 1. Create a `.http` file

Create a file named `api-tests.http`:

\`\`\`http
### Simple GET request
GET https://api.github.com/users/dipankharel

###

### POST request with JSON body
POST https://httpbin.org/post
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com"
}
\`\`\`

### 2. Send the request

Click the **"Send Request"** button that appears above each request, or:
- Right-click → "POSTPER: Send Request"
- Command Palette (`Ctrl+Shift+P`) → "POSTPER: Send Request"

### 3. View the response

The response appears in a side panel showing:
- Status code and response time
- Headers
- Formatted body (JSON, XML, HTML, etc.)

## 📖 Usage Guide

### Basic Request Format

\`\`\`http
METHOD URL
Header-Name: Header-Value

Request Body (optional)
\`\`\`

### HTTP Methods

Supports all standard HTTP methods:

\`\`\`http
GET https://api.example.com/users
POST https://api.example.com/users
PUT https://api.example.com/users/123
PATCH https://api.example.com/users/123
DELETE https://api.example.com/users/123
HEAD https://api.example.com/users
OPTIONS https://api.example.com/users
\`\`\`

### Request Separators

Use `###` or `---` to separate multiple requests:

\`\`\`http
GET https://api.example.com/users
###
POST https://api.example.com/users
---
DELETE https://api.example.com/users/123
\`\`\`

### Headers

\`\`\`http
GET https://api.example.com/protected
Authorization: Bearer your-token-here
Content-Type: application/json
X-Custom-Header: custom-value
\`\`\`

### Request Body

Body is separated from headers by a blank line:

\`\`\`http
POST https://api.example.com/users
Content-Type: application/json

{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "role": "admin"
}
\`\`\`

### Comments

Add comments to document your requests:

\`\`\`http
# This is a comment
GET https://api.example.com/users # Inline comment

// JavaScript-style comments also work
POST https://api.example.com/users
\`\`\`

## 🌍 Environment Variables

### Create Environment Files

Create `.env` files in your workspace:

**.env** (default):
\`\`\`
BASE_URL=http://localhost:3000
API_KEY=dev-key-12345
\`\`\`

**.env.production**:
\`\`\`
BASE_URL=https://api.production.com
API_KEY=prod-key-67890
\`\`\`

### Use Variables

Reference variables with `{{variable}}` syntax:

\`\`\`http
GET {{BASE_URL}}/api/users
Authorization: Bearer {{API_KEY}}
\`\`\`

### Supported Environment Files

- `.env` - Default environment
- `.env.local` - Local overrides
- `.env.development` - Development environment
- `.env.production` - Production environment
- `.env.test` - Testing environment

## 🔗 Request Chaining

Save responses and use them in subsequent requests:

\`\`\`http
### Step 1: Login and save response
# @name login
POST {{BASE_URL}}/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "secret"
}

###

### Step 2: Use token from login
GET {{BASE_URL}}/protected
Authorization: Bearer {{login.response.body.token}}

###

### Step 3: Create resource with user info
POST {{BASE_URL}}/resources
Authorization: Bearer {{login.response.body.token}}
Content-Type: application/json

{
  "name": "New Resource",
  "owner_id": "{{login.response.body.user.id}}"
}
\`\`\`

### Accessing Response Data

- **Body property:** `{{name.response.body.property}}`
- **Nested property:** `{{name.response.body.user.id}}`
- **Array element:** `{{name.response.body.items[0].name}}`
- **Header:** `{{name.response.headers.contenttype}}`
- **Status code:** `{{name.response.status}}`

### Clear Saved Responses

Command: **POSTPER: Clear Response Chain** (`Ctrl+Shift+P`)

## 📤 File Uploads

Upload files using multipart/form-data:

\`\`\`http
POST {{BASE_URL}}/upload
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="title"

My Document
------WebKitFormBoundary
Content-Disposition: form-data; name="file"; filename="document.pdf"
Content-Type: application/pdf

< ./path/to/document.pdf
------WebKitFormBoundary--
\`\`\`

**Note:** File paths are relative to your workspace root.

## ⚙️ Configuration

Access settings via: `File` → `Preferences` → `Settings` → Search "POSTPER"

### Available Settings

- **postper.timeout** - Request timeout in milliseconds (default: 30000)
- **postper.maxRedirects** - Maximum redirects to follow (default: 5)

## 🎯 Commands

Access via Command Palette (`Ctrl+Shift+P`):

- **POSTPER: Send Request** - Execute the HTTP request
- **POSTPER: Cancel Request** - Cancel ongoing request
- **POSTPER: Copy as cURL** - Copy request as cURL command
- **POSTPER: Clear Response Chain** - Clear all saved responses

## 🔥 Tips & Tricks

### Organize Large Files

\`\`\`http
# ========================================
# Authentication Endpoints
# ========================================

### Login
POST /auth/login
###

### Logout
POST /auth/logout
###

# ========================================
# User Management
# ========================================

### Get Users
GET /api/users
###
\`\`\`

### Test Multiple Scenarios

\`\`\`http
### Valid User (Should succeed)
POST /api/users
Content-Type: application/json

{"name": "Valid", "email": "valid@example.com"}

###

### Missing Email (Should fail with 400)
POST /api/users
Content-Type: application/json

{"name": "Invalid"}

###

### Duplicate Email (Should fail with 409)
POST /api/users
Content-Type: application/json

{"name": "Duplicate", "email": "valid@example.com"}
\`\`\`

### Multiple Environments

Switch between environments by changing which `.env` file the extension loads:

\`\`\`
project/
├── .env              # Default (localhost)
├── .env.development  # Dev server
├── .env.production   # Production
└── api-tests.http
\`\`\`

## 📝 Examples

Check out the `examples/` folder in the [GitHub repository](https://github.com/dipankharel/postper) for more examples:

- REST API CRUD operations
- Authentication flows
- File uploads
- GraphQL queries
- WebSocket connections (coming soon)

## 🐛 Known Limitations

- Headers with hyphens in chain variables (use simple names)
- Binary file downloads (text responses only)
- WebSocket support (planned for v2.0)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built using TypeScript and VS Code Extension API

## 📞 Support

- 🐛 **Report bugs:** [GitHub Issues](https://github.com/dipankharel/postper/issues)
- 💬 **Discussions:** [GitHub Discussions](https://github.com/dipankharel/postper/discussions)
- ⭐ **Star on GitHub:** [github.com/dipankharel/postper](https://github.com/dipankharel/postper)

---

**Made by Dipan Kharel**
\`\`\`

---

\`\`\`
MIT License

Copyright (c) 2025 Dipan Kharel

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
\`\`\`

---
