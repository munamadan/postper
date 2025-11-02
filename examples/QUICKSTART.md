# POSTPER Quick Start Guide

Welcome to POSTPER. This guide will get you up and running in five minutes.

## Step 1: Create Your First Request

1. Create a new file: `test.http`
2. Add a simple request:
```http
GET https://httpbin.org/get
```

3. Click the **"Send Request"** button that appears above the request
4. View the response in the panel that opens!

## Step 2: Try Different HTTP Methods
```http
### GET request
GET https://httpbin.org/get

###

### POST with JSON
POST https://httpbin.org/post
Content-Type: application/json

{
  "name": "Test User",
  "email": "test@example.com"
}
```

## Step 3: Add Environment Variables

1. Create `.env` in your workspace root:
```
BASE_URL=https://httpbin.org
API_KEY=my-secret-key
```

2. Use variables in requests:
```http
GET {{BASE_URL}}/headers
Authorization: Bearer {{API_KEY}}
```

## Step 4: Chain Requests
```http
### Save response
# @name login
POST https://httpbin.org/post
Content-Type: application/json

{"username": "testuser"}

###

### Use saved response
GET https://httpbin.org/get?user={{login.response.body.json.username}}
```

## Step 5: Upload Files
```http
POST https://httpbin.org/post
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="file"; filename="test.txt"

< ./test.txt
------WebKitFormBoundary--
```

## Tips

- Use `###` or `---` to separate multiple requests
- Add `# comments` to document your API tests
- Press `Ctrl+Shift+P` → "POSTPER: Send Request" to execute
- Right-click → "POSTPER: Send Request" also works

## Learn More

Check out the example files:
- `01-basic-requests.http` - HTTP methods and headers
- `02-environment-variables.http` - Using .env files
- `03-request-chaining.http` - Save and reuse responses
- `04-file-upload.http` - Upload files with multipart

## Need Help?

- Open an issue: https://github.com/dipankharel/postper/issues
- Read the README: https://github.com/dipankharel/postper

Happy testing!