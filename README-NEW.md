# Relazio Plugin Example

> **🎉 Aggiornato con SDK v1.0 e Multi-Tenant Support**

Plugin di esempio per la piattaforma Relazio che dimostra l'uso dell'SDK ufficiale con supporto multi-tenant completo.

## 🚀 Caratteristiche

- ✅ **Multi-Tenant**: Supporta multiple organizzazioni con secret univoci
- ✅ **Transform Sincrone**: Risposta immediata (< 5 secondi)
- ✅ **Transform Asincrone**: Job con progresso per operazioni lunghe
- ✅ **Auto-Registration**: Endpoint `/register` e `/unregister` automatici
- ✅ **HMAC Signature**: Webhook firmati per sicurezza
- ✅ **SDK-Based**: Usa `@relazio/plugin-sdk` ufficiale

## 📦 Installazione

```bash
# Installa dipendenze
npm install

# Build
npm run build

# Avvia in sviluppo (con auto-reload)
npm run dev

# Avvia in produzione
npm start
```

## 🔧 Configurazione

### Variabili d'Ambiente

Crea un file `.env`:

```env
PORT=3000
HOST=0.0.0.0
NODE_ENV=development
```

**Nota**: Con il multi-tenant, NON serve più `WEBHOOK_SECRET` nel `.env`. Ogni organizzazione riceve automaticamente il proprio secret durante l'installazione.

## 🏗️ Architettura

### Prima (Vecchio Codice)
```
❌ Express manuale
❌ Gestione manuale di /register
❌ Un solo WEBHOOK_SECRET condiviso
❌ Logica custom per webhook
```

### Dopo (Con SDK)
```
✅ SDK gestisce tutto automaticamente
✅ /register e /unregister inclusi
✅ Secret univoco per organizzazione
✅ HMAC automatico per webhook
✅ Registry integrato (in-memory o custom)
```

## 📝 Esempio d'Uso

### Codice Minimo

```typescript
import { RelazioPlugin } from '@relazio/plugin-sdk';

const plugin = new RelazioPlugin({
  id: 'my-plugin',
  name: 'My Plugin',
  version: '1.0.0',
  author: 'Me',
  description: 'Example plugin',
  category: 'network',
});

// Transform sincrona
plugin.transform({
  id: 'my-transform',
  name: 'My Transform',
  description: 'Does something cool',
  inputTypes: ['ip'],
  outputTypes: ['domain'],
  async: false,
  
  async handler(input, config) {
    console.log('Organization:', input.organizationId);
    
    return {
      entities: [
        {
          type: 'domain',
          value: 'example.com',
          properties: {}
        }
      ],
      edges: []
    };
  }
});

// Transform asincrona con progresso
plugin.asyncTransform({
  id: 'long-task',
  name: 'Long Task',
  description: 'Takes a while',
  inputTypes: ['ip'],
  outputTypes: ['note'],
  async: true,
  estimatedTime: 60,
  
  async handler(input, config, job) {
    await job.updateProgress(25, 'Step 1...');
    // ... do work ...
    
    await job.updateProgress(50, 'Step 2...');
    // ... more work ...
    
    await job.updateProgress(100, 'Done!');
    
    return { entities: [], edges: [] };
  }
});

// Avvia con multi-tenant
await plugin.start({
  port: 3000,
  multiTenant: true
});
```

## 🔐 Flusso Multi-Tenant

### 1. Installazione

```
User → Inserisce manifest URL in Relazio
  ↓
Relazio → GET http://plugin:3000/manifest.json
Relazio → POST http://plugin:3000/register
          {
            organizationId: "org-123",
            organizationName: "ACME Corp",
            platformUrl: "https://relazio.io"
          }
  ↓
Plugin SDK → Genera secret: whs_abc123...
Plugin SDK → Salva: org-123 → whs_abc123...
Plugin SDK → Risponde: { webhookSecret: "whs_abc123..." }
  ↓
Relazio → Salva secret nel DB
✅ Plugin installato!
```

### 2. Esecuzione Transform

```
User → Esegue transform in Relazio
  ↓
Relazio → POST http://plugin:3000/scan-ip
          Header: X-Organization-Id: org-123
          Body: { input: {...}, callbackUrl: "..." }
  ↓
Plugin SDK → Legge org-123 dall'header
Plugin SDK → Recupera secret per org-123
Plugin SDK → Esegue transform
Plugin SDK → Firma webhook con secret di org-123
Plugin SDK → POST callbackUrl (con HMAC signature)
  ↓
Relazio → Verifica HMAC con secret di org-123
✅ Risultati accettati!
```

### 3. Disinstallazione

```
User → Disinstalla plugin
  ↓
Relazio → POST http://plugin:3000/unregister
          { organizationId: "org-123" }
  ↓
Plugin SDK → Rimuove registrazione org-123
Plugin SDK → Risponde: { success: true }
  ↓
Relazio → Elimina dal DB
✅ Plugin disinstallato!
```

## 🧪 Testing

### Test Locale

```bash
# Avvia plugin
npm run dev

# In altro terminale, testa il manifest
curl http://localhost:3000/manifest.json

# Simula registrazione
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "test-org-123",
    "organizationName": "Test Org",
    "platformUrl": "http://localhost:3000"
  }'

# Output:
# {
#   "webhookSecret": "whs_a1b2c3...",
#   "pluginId": "ip-lookup-plugin",
#   "pluginVersion": "1.0.0",
#   "message": "Organization registered successfully"
# }
```

### Test Transform

```bash
# Transform sincrona
curl -X POST http://localhost:3000/lookup-ip \
  -H "Content-Type: application/json" \
  -H "X-Organization-Id: test-org-123" \
  -d '{
    "transformId": "lookup-ip",
    "input": {
      "entity": {
        "type": "ip",
        "value": "8.8.8.8"
      }
    }
  }'

# Transform asincrona
curl -X POST http://localhost:3000/scan-ip \
  -H "Content-Type: application/json" \
  -H "X-Organization-Id: test-org-123" \
  -d '{
    "transformId": "scan-ip",
    "input": {
      "entity": {
        "type": "ip",
        "value": "8.8.8.8"
      }
    },
    "callbackUrl": "http://localhost:3000/webhook-test"
  }'

# Output:
# {
#   "async": true,
#   "jobId": "ip-lookup-plugin-scan-ip-1234567890",
#   "estimatedTime": 120
# }
```

## 📚 Transforms Disponibili

### 1. `lookup-ip` (Sincrona)

**Input**: IP address  
**Output**: Location, Organization, Note  
**Tempo**: < 5 secondi

Recupera informazioni base sull'IP (location, ISP, ASN).

### 2. `scan-ip` (Asincrona)

**Input**: IP address  
**Output**: Domains, Note  
**Tempo**: ~2 minuti

Analisi approfondita:
- Reverse DNS
- Port scan
- Reputation check
- Associated domains

## 🔄 Migrazione dal Vecchio Codice

### Prima

```typescript
// express manuale
app.post('/register', async (req, res) => {
  // implementazione manuale...
});

app.post('/transform/lookup-ip', async (req, res) => {
  // logica custom...
  const secret = process.env.WEBHOOK_SECRET; // ❌ Un solo secret
  // firma webhook manualmente...
});
```

### Dopo

```typescript
import { RelazioPlugin } from '@relazio/plugin-sdk';

const plugin = new RelazioPlugin({ /* config */ });

plugin.transform({
  id: 'lookup-ip',
  async handler(input, config) {
    // ✅ organizationId disponibile in input
    // ✅ SDK gestisce HMAC automaticamente
    return { entities: [], edges: [] };
  }
});

await plugin.start({ multiTenant: true });
// ✅ /register incluso automaticamente
// ✅ Secret univoco per org
```

## 🚀 Deployment

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/index-new.js"]
```

```bash
docker build -t my-plugin .
docker run -p 3000:3000 my-plugin
```

### Storage Persistente (Produzione)

Per produzione, usa storage persistente invece di in-memory:

```typescript
import { InstallationRegistry } from '@relazio/plugin-sdk';
import Redis from 'ioredis';

// Custom storage con Redis
class RedisStorage implements InstallationStorage {
  // ... implementazione ...
}

const registry = new InstallationRegistry(
  'my-plugin',
  '1.0.0',
  new RedisStorage()
);

plugin.enableMultiTenant(registry);
```

## 📖 Documentazione

- [SDK Documentation](../relazio-plugin-sdk/README.md)
- [Multi-Tenant Guide](../relazio-plugin-sdk/docs/MULTI_TENANT.md)
- [Plugin System Architecture](../relazio/docs/plugins/EXTERNAL_PLUGINS.md)

## 🐛 Troubleshooting

### Plugin non riceve organizationId

**Problema**: `input.organizationId` è `undefined`

**Soluzione**: Verifica che Relazio invii l'header `X-Organization-Id`

### Webhook fallisce con errore HMAC

**Problema**: Signature non valida

**Causa**: Ogni org ha un secret diverso. Verifica che:
1. Il plugin usi il secret dell'org corretta
2. Relazio verifichi con lo stesso secret

### Registrazione fallisce

**Problema**: POST /register ritorna errore

**Debug**:
```typescript
const registry = plugin.getRegistry();
const stats = await registry.getStats();
console.log('Installazioni:', stats);
```

## 📝 License

MIT - Vedi [LICENSE](./LICENSE)

