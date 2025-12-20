import type { PluginManifest } from './types.js';

const BASE_URL = process.env.PLUGIN_BASE_URL || 'http://localhost:3000';

export const manifest: PluginManifest = {
  manifestVersion: '1.0',
  plugin: {
    id: 'ip-lookup-example',
    name: 'IP Lookup Example',
    version: '1.0.0',
    description: 'Example plugin that performs IP lookup and deep scanning. Demonstrates both sync and async transforms.',
    author: 'Relazio Community',
    homepage: 'https://github.com/rstlgu/relazio-plugin-example',
    icon: '🌐',
    category: 'network',
    tags: ['ip', 'geolocation', 'network', 'security', 'example'],
    capabilities: {
      inputTypes: ['ip'],
      outputTypes: ['location', 'note', 'organization', 'domain'],
      supportsAsync: true,
    },
    transforms: [
      {
        id: 'lookup-ip',
        name: 'IP Information',
        description: 'Get geolocation and organization info for an IP address (sync)',
        inputType: 'ip',
        outputTypes: ['location', 'note', 'organization'],
        endpoint: `${BASE_URL}/transform/lookup-ip`,
        method: 'POST',
        async: false,
      },
      {
        id: 'scan-ip',
        name: 'Deep IP Scan',
        description: 'Perform deep analysis: reverse DNS, open ports, reputation, threats (async)',
        inputType: 'ip',
        outputTypes: ['note', 'domain', 'organization'],
        endpoint: `${BASE_URL}/transform/scan-ip`,
        method: 'POST',
        async: true,
        configSchema: {
          type: 'object',
          properties: {
            includePortScan: {
              type: 'boolean',
              description: 'Include port scanning in the analysis',
              default: true,
            },
            includeReputation: {
              type: 'boolean',
              description: 'Check IP reputation and threats',
              default: true,
            },
          },
          required: [],
        },
      },
    ],
    rateLimit: {
      maxRequestsPerMinute: 60,
    },
  },
};

