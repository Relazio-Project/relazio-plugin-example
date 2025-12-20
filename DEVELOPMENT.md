# Development Guide

## Setup

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your settings
nano .env
```

## Development Workflow

### 1. Start the development server

```bash
npm run dev
```

The server will restart automatically on file changes.

### 2. Expose via ngrok (for testing with Relazio)

```bash
# In another terminal
ngrok http 3000
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`) and update `PLUGIN_BASE_URL` in `.env`:

```env
PLUGIN_BASE_URL=https://abc123.ngrok.io
```

Restart the dev server.

### 3. Install in Relazio

1. Open Relazio dashboard
2. Go to Plugins → Custom
3. Click "Add External Plugin"
4. Enter your manifest URL: `https://abc123.ngrok.io/manifest.json`
5. Copy the generated webhook secret
6. Update `.env`:
   ```env
   WEBHOOK_SECRET=the-secret-from-relazio
   ```
7. Restart dev server

### 4. Test the transforms

- Go to a graph in Relazio
- Add an IP entity (e.g., `8.8.8.8`)
- Right-click → Transforms
- Run "IP Information" (sync) or "Deep IP Scan" (async)

## Testing

### Test HMAC signing

```bash
npm run test-hmac
```

### Validate manifest

```bash
npm run validate-manifest
```

### Generate manifest.json

```bash
npm run generate-manifest
```

### Manual API testing

#### Test sync transform

```bash
curl -X POST http://localhost:3000/transform/lookup-ip \
  -H "Content-Type: application/json" \
  -d '{
    "transformId": "lookup-ip",
    "input": {
      "entity": {"type": "ip", "value": "8.8.8.8"},
      "config": {}
    },
    "callbackUrl": "https://webhook.site/your-unique-url"
  }'
```

#### Test async transform

```bash
curl -X POST http://localhost:3000/transform/scan-ip \
  -H "Content-Type: application/json" \
  -d '{
    "transformId": "scan-ip",
    "input": {
      "entity": {"type": "ip", "value": "8.8.8.8"},
      "config": {"includePortScan": true, "includeReputation": true}
    },
    "callbackUrl": "https://webhook.site/your-unique-url"
  }'
```

You'll get a `jobId` in the response. Check the webhook URL to see the async result.

#### Check job status

```bash
curl http://localhost:3000/jobs/job-123456
```

## Project Structure

```
src/
├── index.ts                 # Main Express server
├── manifest.ts              # Plugin manifest definition
├── types.ts                 # TypeScript types
├── transforms/
│   ├── lookup-ip.ts         # Sync transform implementation
│   └── scan-ip.ts           # Async transform implementation
└── utils/
    ├── hmac.ts              # HMAC signature utilities
    └── webhook.ts           # Webhook sending utilities
```

## Adding a New Transform

1. **Define in manifest** (`src/manifest.ts`):

```typescript
{
  id: 'my-transform',
  name: 'My Transform',
  inputType: 'domain',
  outputTypes: ['ip', 'note'],
  endpoint: `${BASE_URL}/transform/my-transform`,
  method: 'POST',
  async: false,
}
```

2. **Implement the handler** (`src/transforms/my-transform.ts`):

```typescript
import type { Request, Response } from 'express';
import type { TransformRequest, SyncTransformResponse } from '../types.js';

export async function myTransform(
  req: Request<object, object, TransformRequest>,
  res: Response<SyncTransformResponse>
): Promise<void> {
  const { input } = req.body;
  
  // Your logic here
  
  res.json({
    async: false,
    result: {
      entities: [],
      edges: [],
    },
  });
}
```

3. **Register the route** (`src/index.ts`):

```typescript
import { myTransform } from './transforms/my-transform.js';

app.post('/transform/my-transform', myTransform);
```

## Debugging

### Enable verbose logging

Set in `.env`:

```env
LOG_LEVEL=debug
```

### View logs

```bash
# Development
# Logs appear in the terminal

# Production (with PM2)
pm2 logs relazio-plugin

# Production (with systemd)
journalctl -u relazio-plugin -f
```

## Common Issues

### Webhook signature verification fails

- Ensure `WEBHOOK_SECRET` in `.env` matches the one from Relazio
- Restart the server after updating `.env`
- Check that the payload is sent as raw JSON (not form-encoded)

### Async transform doesn't send webhook

- Check that `callbackUrl` is accessible from your server
- Verify HMAC signature is correct
- Check Relazio logs for webhook errors

### Manifest validation fails

- Run `npm run validate-manifest`
- Ensure all URLs are HTTPS (except localhost)
- Check that `PLUGIN_BASE_URL` is set correctly

## Production Deployment

See `README.md` for deployment instructions.

