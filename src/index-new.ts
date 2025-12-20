/**
 * Relazio Plugin Example - Using SDK with Multi-Tenant Support
 * 
 * This example demonstrates how to build a plugin using the official SDK
 * with full multi-tenant support via the InstallationRegistry.
 */

import dotenv from 'dotenv';
import { RelazioPlugin } from '@relazio/plugin-sdk';
import type { TransformInput, JobContext } from '@relazio/plugin-sdk';

// Load environment variables
dotenv.config();

// ============================================
// Plugin Configuration
// ============================================

const plugin = new RelazioPlugin({
  id: 'ip-lookup-plugin',
  name: 'IP Lookup Plugin',
  version: '1.0.0',
  author: 'Relazio Community',
  description: 'Example plugin for IP address analysis with multi-tenant support',
  category: 'network',
});

// ============================================
// Synchronous Transform: Quick IP Lookup
// ============================================

plugin.transform({
  id: 'lookup-ip',
  name: 'Quick IP Lookup',
  description: 'Fast IP information lookup (location, ISP)',
  inputType: 'ip',
  outputTypes: ['location', 'organization', 'note'],
  
  async handler(input: TransformInput, config: Record<string, unknown>) {
    const ip = input.entity.value;
    const orgId = input.organizationId;
    
    console.log(`[SYNC] Looking up IP ${ip} for org ${orgId}`);

    // Mock IP lookup (in production, use real API)
    const ipInfo = await mockIpLookup(ip);

    const results = {
      entities: [] as any[],
      edges: [] as any[],
    };

    // Add location entity
    if (ipInfo.location) {
      const locationId = `location-${ipInfo.location.city}`;
      results.entities.push({
        type: 'location',
        value: `${ipInfo.location.city}, ${ipInfo.location.country}`,
        properties: {
          city: ipInfo.location.city,
          country: ipInfo.location.country,
          latitude: ipInfo.location.lat,
          longitude: ipInfo.location.lon,
        },
      });
      results.edges.push({
        from: ip,
        to: locationId,
        label: 'located_in',
      });
    }

    // Add ISP/Organization entity
    if (ipInfo.isp) {
      const ispId = `org-${ipInfo.isp.replace(/\s+/g, '-').toLowerCase()}`;
      results.entities.push({
        type: 'organization',
        value: ipInfo.isp,
        properties: {
          type: 'isp',
          asn: ipInfo.asn,
        },
      });
      results.edges.push({
        from: ip,
        to: ispId,
        label: 'assigned_by',
      });
    }

    // Add informational note
    const noteId = `note-${ip}`;
    const content = `## IP Information\n\n` +
      `**IP Address**: ${ip}\n` +
      `**Location**: ${ipInfo.location?.city}, ${ipInfo.location?.country}\n` +
      `**ISP**: ${ipInfo.isp}\n` +
      `**ASN**: ${ipInfo.asn}\n` +
      `**Type**: ${ipInfo.type}\n\n` +
      `*Retrieved by IP Lookup Plugin*`;

    results.entities.push({
      type: 'note',
      value: `IP Info: ${ip}`,
      properties: {
        content,
        tags: ['ip-info', 'network'],
      },
    });
    results.edges.push({
      from: ip,
      to: noteId,
      label: 'has_info',
    });

    return results;
  },
});

// ============================================
// Asynchronous Transform: Deep IP Scan
// ============================================

plugin.asyncTransform({
  id: 'scan-ip',
  name: 'Deep IP Scan',
  description: 'Comprehensive IP analysis (reverse DNS, ports, reputation)',
  inputType: 'ip',
  outputTypes: ['domain', 'note'],

  async handler(
    input: TransformInput,
    config: Record<string, unknown>,
    job: JobContext
  ) {
    const ip = input.entity.value;
    const orgId = input.organizationId;
    
    console.log(`[ASYNC] Deep scan for IP ${ip} (org: ${orgId}, job: ${job.jobId})`);

    try {
      // Step 1: Reverse DNS (20% progress)
      await job.updateProgress(10, 'Starting reverse DNS lookup...');
      await sleep(2000);
      const reverseDns = await mockReverseDNS(ip);
      await job.updateProgress(30, 'Reverse DNS completed');
      
      // Step 2: Port scan (40% progress)
      await job.updateProgress(30, 'Scanning ports...');
      await sleep(3000);
      const portScan = await mockPortScan(ip);
      await job.updateProgress(60, 'Port scan completed');

      // Step 3: Reputation check (60% progress)
      await job.updateProgress(60, 'Checking reputation...');
      await sleep(2000);
      const reputation = await mockReputation(ip);
      await job.updateProgress(80, 'Reputation check completed');

      // Step 4: Associated domains (80% progress)
      await job.updateProgress(80, 'Finding associated domains...');
      await sleep(2000);
      const domains = await mockAssociatedDomains(ip);
      await job.updateProgress(95, 'Finalizing results...');

      // Build results
      const results = {
        entities: [] as any[],
        edges: [] as any[],
      };

      // Add domains
      domains.forEach((domain) => {
        const domainId = `domain-${domain}`;
        results.entities.push({
          type: 'domain',
          value: domain,
          properties: {
            source: 'reverse-dns',
          },
        });
        results.edges.push({
          from: ip,
          to: domainId,
          label: 'resolves_to',
        });
      });

      // Add comprehensive note
      const noteId = `note-scan-${ip}`;
      let content = `## Deep Scan Results for ${ip}\n\n`;

      if (reverseDns.length > 0) {
        content += `### Reverse DNS\n${reverseDns.map((d) => `- ${d}`).join('\n')}\n\n`;
      }

      if (portScan) {
        content += `### Open Ports\n${portScan.openPorts.map((p) => `- Port ${p}`).join('\n')}\n\n`;
        if (portScan.services.length > 0) {
          content += `### Services\n${portScan.services.map((s) => `- ${s}`).join('\n')}\n\n`;
        }
      }

      if (reputation) {
        content += `### Reputation\n`;
        content += `- **Score**: ${reputation.score}/100\n`;
        content += `- **Category**: ${reputation.category}\n`;
        if (reputation.threats?.length) {
          content += `- **Threats**: ${reputation.threats.join(', ')}\n`;
        }
        content += `\n`;
      }

      content += `**Scan Duration**: ~2 minutes\n`;
      content += `**Organization**: ${orgId}\n`;

      results.entities.push({
        type: 'note',
        value: `Deep Scan: ${ip}`,
        properties: {
          content,
          tags: ['deep-scan', 'security', 'network'],
        },
      });
      results.edges.push({
        from: ip,
        to: noteId,
        label: 'has_analysis',
      });

      console.log(`[ASYNC] Job ${job.jobId} completed successfully`);
      return results;
    } catch (error) {
      console.error(`[ASYNC] Job ${job.jobId} failed:`, error);
      throw error;
    }
  },
});

// ============================================
// Start Server with Multi-Tenant Support
// ============================================

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

(async () => {
  try {
    await plugin.start({
      port: PORT,
      host: HOST,
      multiTenant: true, // ← Enable multi-tenant support with in-memory registry
    });

    console.log('\n🎉 Multi-tenant plugin ready!');
    console.log(`   Organizations can install this plugin via:`);
    console.log(`   http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/manifest.json\n`);
  } catch (error) {
    console.error('❌ Failed to start plugin:', error);
    process.exit(1);
  }
})();

// ============================================
// Mock Functions (Replace with real APIs)
// ============================================

async function mockIpLookup(ip: string) {
  return {
    location: {
      city: 'New York',
      country: 'United States',
      lat: 40.7128,
      lon: -74.0060,
    },
    isp: 'Example ISP Inc.',
    asn: 'AS12345',
    type: 'residential',
  };
}

async function mockReverseDNS(ip: string): Promise<string[]> {
  return [
    `host-${ip.replace(/\./g, '-')}.example.com`,
    'mail.example.com',
  ];
}

async function mockPortScan(ip: string) {
  return {
    openPorts: [80, 443, 22],
    services: ['HTTP', 'HTTPS', 'SSH'],
  };
}

async function mockReputation(ip: string) {
  const score = Math.floor(Math.random() * 100);
  return {
    score,
    category: score > 70 ? 'clean' : score > 40 ? 'suspicious' : 'malicious',
    threats: score < 40 ? ['spam', 'port-scan'] : [],
  };
}

async function mockAssociatedDomains(ip: string): Promise<string[]> {
  return [
    'example.com',
    'test.example.com',
    `app-${ip.split('.')[3]}.example.com`,
  ];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

