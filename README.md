# Relazio Plugin Example

> Example external plugin for Relazio platform - IP Lookup Plugin

This is a complete, production-ready example of how to create an external plugin for [Relazio](https://github.com/relazio/relazio).

**Features demonstrated:**
- ✅ Synchronous transforms (< 30s)
- ✅ Asynchronous transforms (minutes/hours)
- ✅ HMAC webhook signatures
- ✅ Job progress tracking
- ✅ Manifest JSON validation
- ✅ Error handling
- ✅ HTTPS support

---

## 📋 Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm
- SSL certificate (for production) or ngrok (for development)

### Installation

```bash
# Clone the repository
git clone https://github.com/rstlgu/relazio-plugin-example.git
cd relazio-plugin-example

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your settings
nano .env
```

### Configuration

Edit `.env`:

```env
PORT=3000
WEBHOOK_SECRET=your-webhook-secret-from-relazio
NODE_ENV=development

# Optional: API keys for external services
IPINFO_API_KEY=your-ipinfo-key
```

### Running the Plugin

#### Development (with ngrok)

```bash
# Terminal 1: Start the server
npm run dev

# Terminal 2: Start ngrok
ngrok http 3000
```

Copy the ngrok HTTPS URL (e.g., `https://abc123.ngrok.io`) and use it in your manifest.

#### Production

```bash
# Build
npm run build

# Start
npm start
```

---

## 🔌 Installing in Relazio

1. **Start your plugin server** (with HTTPS)
2. **Get your manifest URL**: `https://your-domain.com/manifest.json`
3. **In Relazio**:
   - Go to Dashboard → Plugins → Custom tab
   - Click "Add External Plugin"
   - Enter your manifest URL
   - Copy the webhook secret
4. **Update your `.env`** with the webhook secret
5. **Restart your plugin server**

---

## 📄 Manifest Structure

The plugin exposes a manifest at `/manifest.json`:

```json
{
  "manifestVersion": "1.0",
  "plugin": {
    "id": "ip-lookup-example",
    "name": "IP Lookup Example",
    "version": "1.0.0",
    "author": "Your Name",
    "category": "network",
    "capabilities": {
      "inputTypes": ["ip"],
      "outputTypes": ["location", "note", "organization"],
      "supportsAsync": true
    },
    "transforms": [
      {
        "id": "lookup-ip",
        "name": "IP Information (Sync)",
        "inputType": "ip",
        "outputTypes": ["location", "note"],
        "endpoint": "https://your-domain.com/transform/lookup-ip",
        "method": "POST",
        "async": false
      },
      {
        "id": "scan-ip",
        "name": "Deep IP Scan (Async)",
        "inputType": "ip",
        "outputTypes": ["note", "organization"],
        "endpoint": "https://your-domain.com/transform/scan-ip",
        "method": "POST",
        "async": true
      }
    ]
  }
}
```

---

## 🔄 Transform Types

### Synchronous Transform

Returns results immediately (< 30s):

```typescript
POST /transform/lookup-ip
{
  "transformId": "lookup-ip",
  "input": {
    "entity": { "type": "ip", "value": "8.8.8.8" },
    "config": {}
  },
  "callbackUrl": "https://relazio.io/api/webhooks/transforms/job-123"
}

Response:
{
  "async": false,
  "result": {
    "entities": [...],
    "edges": [...]
  }
}
```

### Asynchronous Transform

Accepts job and processes in background:

```typescript
POST /transform/scan-ip
{
  "transformId": "scan-ip",
  "input": {
    "entity": { "type": "ip", "value": "8.8.8.8" },
    "config": {}
  },
  "callbackUrl": "https://relazio.io/api/webhooks/transforms/job-123"
}

Response:
{
  "async": true,
  "jobId": "job-abc-123",
  "estimatedTime": 300
}

// Later, sends webhook to callbackUrl:
POST https://relazio.io/api/webhooks/transforms/job-123
Headers:
  X-Plugin-Signature: sha256=abc123...
Body:
{
  "jobId": "job-123",
  "status": "completed",
  "result": { "entities": [...], "edges": [...] }
}
```

---

## 🔐 Security

### HMAC Signature

All webhooks are signed with HMAC-SHA256:

```typescript
import crypto from 'crypto';

function signWebhook(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

// Usage
const body = JSON.stringify(webhookPayload);
const signature = signWebhook(body, process.env.WEBHOOK_SECRET);
headers['X-Plugin-Signature'] = `sha256=${signature}`;
```

Relazio verifies the signature before processing webhooks.

---

## 📁 Project Structure

```
relazio-plugin-example/
├── src/
│   ├── index.ts              # Main server
│   ├── manifest.ts           # Manifest generator
│   ├── transforms/
│   │   ├── lookup-ip.ts      # Sync transform
│   │   └── scan-ip.ts        # Async transform
│   ├── utils/
│   │   ├── hmac.ts           # HMAC signature
│   │   └── webhook.ts        # Webhook sender
│   └── types.ts              # TypeScript types
├── manifest.json             # Generated manifest
├── package.json
├── tsconfig.json
├── .env.example
├── Dockerfile                # Optional Docker support
└── README.md
```

---

## 🧪 Testing

```bash
# Run tests
npm test

# Test manifest validation
npm run validate-manifest

# Test HMAC signature
npm run test-hmac
```

### Manual Testing

```bash
# Test sync transform
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

# Test async transform
curl -X POST http://localhost:3000/transform/scan-ip \
  -H "Content-Type: application/json" \
  -d '{
    "transformId": "scan-ip",
    "input": {
      "entity": {"type": "ip", "value": "8.8.8.8"},
      "config": {}
    },
    "callbackUrl": "https://webhook.site/your-unique-url"
  }'
```

---

## 🚀 Deployment

### Using Docker

```bash
# Build image
docker build -t relazio-plugin-example .

# Run container
docker run -p 3000:3000 \
  -e WEBHOOK_SECRET=your-secret \
  relazio-plugin-example
```

### Using PM2

```bash
# Install PM2
npm install -g pm2

# Start
pm2 start npm --name "relazio-plugin" -- start

# Monitor
pm2 monit
```

### Using systemd

See `deploy/relazio-plugin.service` for systemd configuration.

---

## 📚 Documentation

- **Relazio Documentation**: [docs/plugins/](https://github.com/relazio/relazio/tree/main/docs/plugins)
- **SDK Reference**: [SDK.md](https://github.com/relazio/relazio/blob/main/docs/plugins/SDK.md)
- **Architecture**: [EXTERNAL_PLUGINS.md](https://github.com/relazio/relazio/blob/main/docs/plugins/EXTERNAL_PLUGINS.md)

---

## 🤝 Contributing

Contributions welcome! This is an example plugin, so feel free to fork and adapt.

---

## 📄 License

MIT License - see LICENSE file

---

## 🔗 Links

- **Relazio Platform**: https://github.com/relazio/relazio
- **Plugin SDK**: https://github.com/relazio/plugin-sdk (coming Q1 2026)
- **Issues**: https://github.com/rstlgu/relazio-plugin-example/issues

---

**Made with ❤️ for the Relazio community**

*"Rivela le connessioni nascoste"*

