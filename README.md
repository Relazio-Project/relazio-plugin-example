# Relazio Plugin Example

Example plugin demonstrating the use of `@relazio/plugin-sdk` with multi-tenant support.

## Features

- **Multi-Tenant**: Supports multiple organizations with isolated configurations
- **Sync Transform**: Quick IP lookup (location, ISP)
- **Async Transform**: Deep IP scan (reverse DNS, ports, reputation)
- **Mock Data**: Uses mock functions for demonstration

## Installation

```bash
npm install
```

## Usage

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

The plugin will start on port 3000 (configurable via `PORT` environment variable).

## Testing

### Health Check

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "ok",
  "plugin": "ip-lookup-plugin",
  "version": "1.0.0",
  "uptime": 123.45,
  "transforms": {
    "sync": 1,
    "async": 1
  }
}
```

### Manifest

```bash
curl http://localhost:3000/manifest.json
```

### Register Organization (Multi-Tenant)

```bash
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "org-123",
    "organizationName": "My Organization",
    "platformUrl": "https://relazio.io"
  }'
```

Response:
```json
{
  "webhookSecret": "whs_abc123...",
  "pluginId": "ip-lookup-plugin",
  "pluginVersion": "1.0.0",
  "message": "Organization registered successfully"
}
```

### Execute Transform (Sync)

```bash
curl -X POST http://localhost:3000/lookup-ip \
  -H "Content-Type: application/json" \
  -H "X-Organization-Id: org-123" \
  -d '{
    "transformId": "lookup-ip",
    "input": {
      "entity": {
        "id": "test-1",
        "type": "ip",
        "value": "8.8.8.8"
      }
    }
  }'
```

### Execute Transform (Async)

```bash
curl -X POST http://localhost:3000/scan-ip \
  -H "Content-Type: application/json" \
  -H "X-Organization-Id: org-123" \
  -d '{
    "transformId": "scan-ip",
    "input": {
      "entity": {
        "id": "test-2",
        "type": "ip",
        "value": "8.8.8.8"
      }
    },
    "callbackUrl": "https://your-platform.com/api/webhooks/transforms/job-123"
  }'
```

Response:
```json
{
  "async": true,
  "jobId": "ip-lookup-plugin-scan-ip-1234567890",
  "message": "Job queued for processing"
}
```

## Installation in Relazio

1. Start the plugin:
   ```bash
   npm run dev
   ```

2. In Relazio platform:
   - Navigate to **Dashboard → Plugins → Custom**
   - Click **"Add External Plugin"**
   - Enter manifest URL: `http://localhost:3000/manifest.json`
   - Click **"Install"**

The plugin will automatically:
- Register your organization
- Generate a unique webhook secret
- Be ready to use

## Project Structure

```
relazio-plugin-example/
├── src/
│   └── index.ts          # Main plugin file
├── dist/                 # Compiled JavaScript
├── package.json
├── tsconfig.json
└── README.md
```

## Code Overview

```typescript
import { RelazioPlugin } from '@relazio/plugin-sdk';

// Create plugin
const plugin = new RelazioPlugin({
  id: 'ip-lookup-plugin',
  name: 'IP Lookup Plugin',
  version: '1.0.0',
  author: 'Relazio Community',
  description: 'Example plugin',
  category: 'network',
});

// Add synchronous transform
plugin.transform({
  id: 'lookup-ip',
  name: 'Quick IP Lookup',
  inputType: 'ip',
  outputTypes: ['location', 'organization', 'note'],
  
  async handler(input, config) {
    // Access organization ID
    console.log(input.organizationId);
    
    return {
      entities: [],
      edges: []
    };
  }
});

// Add asynchronous transform
plugin.asyncTransform({
  id: 'scan-ip',
  name: 'Deep IP Scan',
  inputType: 'ip',
  outputTypes: ['domain', 'note'],
  
  async handler(input, config, job) {
    // Update progress
    await job.updateProgress(50, 'Scanning...');
    
    // Return results
    return {
      entities: [],
      edges: []
    };
  }
});

// Start server with multi-tenant support
await plugin.start({
  port: 3000,
  multiTenant: true
});
```

## Environment Variables

- `PORT` - Server port (default: 3000)
- `HOST` - Server host (default: 0.0.0.0)

## Requirements

- Node.js >= 18.0.0
- `@relazio/plugin-sdk` >= 0.1.1

## License

MIT
