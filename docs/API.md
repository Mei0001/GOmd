# math-md API Documentation

## Overview

math-md provides RESTful API endpoints for converting PDF documents to Markdown format with specialized support for mathematical content.

## Base URL

- Development: `http://localhost:3000/api`
- Production: `https://your-domain.com/api`

## Authentication

Currently, no authentication is required for API endpoints. Rate limiting is applied based on IP address.

## Rate Limiting

All API endpoints are subject to rate limiting:

- **Conversion API**: 10 requests per 15 minutes
- **General API**: 60 requests per minute
- **Upload API**: 20 requests per 5 minutes

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Reset time (Unix timestamp)
- `Retry-After`: Seconds to wait when rate limited (429 responses only)

## Endpoints

### POST /api/convert

Converts a PDF file to Markdown format.

#### Request

**Content-Type**: `multipart/form-data`

**Parameters**:
- `file` (required): PDF file to convert (max 100MB)

#### Response

**Success (200)**:
```json
{
  "success": true,
  "markdown": "# Document Title\n\nContent with **formatting** and $$\\frac{a}{b}$$ formulas...",
  "metadata": {
    "fileName": "document.pdf",
    "fileSize": 1024000,
    "totalPages": 5,
    "hasFormulas": true,
    "hasTables": true,
    "hasImages": false,
    "qualityAnalysis": {
      "score": 0.95,
      "confidence": 0.88,
      "completeness": 92,
      "qualityLevel": "high",
      "issues": [],
      "structureElements": {
        "headers": 8,
        "paragraphs": 25,
        "lists": 3,
        "formulas": 12,
        "tables": 2,
        "images": 0
      }
    },
    "fromCache": false
  }
}
```

**Error (400)**:
```json
{
  "error": "ファイルがアップロードされていません"
}
```

**Error (429)**:
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 300
}
```

**Error (500)**:
```json
{
  "error": "変換中にエラーが発生しました"
}
```

### POST /api/convert/stream

Converts a PDF file to Markdown with real-time progress updates via Server-Sent Events.

#### Request

**Content-Type**: `multipart/form-data`

**Parameters**:
- `file` (required): PDF file to convert (max 100MB)

#### Response

**Content-Type**: `text/event-stream`

**Events**:

```
event: progress
data: {"stage":"init","message":"ストリーミング開始","progress":0}

event: progress
data: {"stage":"upload","message":"ファイル受信完了: document.pdf","progress":20}

event: progress
data: {"stage":"cache","message":"キャッシュから結果を取得","progress":90}

event: result
data: {"success":true,"markdown":"...","metadata":{...}}

event: complete
data: {"message":"ストリーミング完了"}
```

**Error Events**:
```
event: error
data: {"error":"ファイルがアップロードされていません"}
```

## Data Types

### ConversionResult

```typescript
interface ConversionResult {
  success: boolean;
  markdown?: string;
  metadata?: {
    fileName?: string;
    fileSize: number;
    totalPages?: number;
    hasFormulas?: boolean;
    hasTables?: boolean;
    hasImages?: boolean;
    qualityAnalysis?: QualityAnalysis;
    fromCache?: boolean;
  };
  error?: {
    message: string;
    code?: string;
  };
}
```

### QualityAnalysis

```typescript
interface QualityAnalysis {
  score: number;           // 0-1 quality score
  confidence: number;      // 0-1 confidence level
  completeness: number;    // 0-100 completeness percentage
  qualityLevel: 'low' | 'medium' | 'high';
  issues: string[];        // Array of quality issues
  structureElements: {
    headers: number;
    paragraphs: number;
    lists: number;
    formulas: number;
    tables: number;
    images: number;
  };
}
```

## Error Codes

- `400`: Bad Request - Invalid file or missing parameters
- `413`: Payload Too Large - File exceeds size limit
- `415`: Unsupported Media Type - File is not a PDF
- `429`: Too Many Requests - Rate limit exceeded
- `500`: Internal Server Error - Conversion failed

## File Requirements

- **Format**: PDF only
- **Size**: Maximum 100MB
- **Content**: Any PDF with text, formulas, tables, and images

## Features

### Mathematical Content Support

- LaTeX formulas are extracted and preserved
- Inline formulas: `$formula$`
- Block formulas: `$$formula$$`
- Complex mathematical symbols and notation

### Table Support

- Tables are converted to Markdown table format
- Column alignment is preserved when possible
- Complex table structures are simplified

### Image Support

- Images are extracted and referenced
- Image references use Markdown format: `![alt text](image)`
- Image files are not included in the response

### Quality Analysis

Each conversion includes a quality analysis with:
- Overall quality score (0-1)
- Confidence level in the conversion
- Completeness percentage
- Identified issues or problems
- Count of structural elements

## Caching

The API implements intelligent caching:
- File content is cached based on file hash
- Conversion results are cached for 1 hour
- Cache hits are indicated in the response metadata
- Cache improves response times for repeated conversions

## Performance

- Average conversion time: 2-10 seconds (depending on file size and complexity)
- Streaming endpoint provides real-time progress
- Memory optimization for large files
- Parallel processing support for multiple files

## Usage Examples

### cURL

```bash
# Basic conversion
curl -X POST \
  -F "file=@document.pdf" \
  http://localhost:3000/api/convert

# Streaming conversion
curl -X POST \
  -F "file=@document.pdf" \
  -H "Accept: text/event-stream" \
  http://localhost:3000/api/convert/stream
```

### JavaScript/Fetch

```javascript
// Basic conversion
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('/api/convert', {
  method: 'POST',
  body: formData
});

const result = await response.json();

// Streaming conversion
const response = await fetch('/api/convert/stream', {
  method: 'POST',
  body: formData
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.substring(6));
      console.log('Progress:', data);
    }
  }
}
```

## Best Practices

1. **File Size**: Keep files under 50MB for best performance
2. **Rate Limiting**: Implement client-side rate limiting to avoid 429 errors
3. **Error Handling**: Always handle conversion errors gracefully
4. **Caching**: Avoid duplicate uploads of the same file
5. **Progress**: Use streaming endpoint for large files to show progress
6. **Validation**: Validate file type and size before upload

## Support

For API support and bug reports, please contact the development team or create an issue in the project repository.