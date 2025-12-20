import type { Request, Response } from 'express';
import type {
  TransformRequest,
  AsyncTransformResponse,
  TransformResult,
  DeepScanResult,
} from '../types.js';
import { sendSuccessWebhook, sendFailureWebhook } from '../utils/webhook.js';

// In-memory job storage (use Redis/Database in production)
const jobs = new Map<string, { status: string; progress: number }>();

/**
 * Asynchronous transform: Deep IP Scan
 * Performs comprehensive analysis including reverse DNS, ports, reputation
 */
export async function scanIp(
  req: Request<object, object, TransformRequest>,
  res: Response<AsyncTransformResponse>
): Promise<void> {
  const { transformId, input, callbackUrl } = req.body;
  const { entity, config } = input;

  console.log(`[ASYNC] Transform ${transformId} for IP: ${entity.value}`);

  try {
    // Validate input
    if (entity.type !== 'ip') {
      throw new Error(`Invalid entity type: ${entity.type}`);
    }

    // Generate job ID
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Store job
    jobs.set(jobId, { status: 'processing', progress: 0 });

    // Start async processing
    processDeepScan(
      jobId,
      entity.value,
      callbackUrl,
      config as { includePortScan?: boolean; includeReputation?: boolean }
    ).catch((error) => {
      console.error(`[ASYNC] Job ${jobId} failed:`, error);
      jobs.set(jobId, { status: 'failed', progress: 0 });
    });

    // Return immediately
    console.log(`[ASYNC] Job ${jobId} accepted`);
    res.json({
      async: true,
      jobId,
      estimatedTime: 120, // 2 minutes estimate
    });
  } catch (error) {
    console.error('[ASYNC] Error:', error);
    res.status(500).json({
      async: true,
      jobId: 'error',
      estimatedTime: 0,
    });
  }
}

/**
 * Process deep scan in background
 */
async function processDeepScan(
  jobId: string,
  ip: string,
  callbackUrl: string,
  config: { includePortScan?: boolean; includeReputation?: boolean }
): Promise<void> {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('WEBHOOK_SECRET not configured');
  }

  try {
    console.log(`[ASYNC] Starting deep scan for ${ip}...`);

    // Simulate progressive scanning
    jobs.set(jobId, { status: 'processing', progress: 10 });

    // Step 1: Reverse DNS lookup
    await sleep(2000);
    const reverseDns = await performReverseDNS(ip);
    jobs.set(jobId, { status: 'processing', progress: 30 });
    console.log(`[ASYNC] Reverse DNS completed: ${reverseDns.length} results`);

    // Step 2: Port scan (if enabled)
    await sleep(3000);
    const portScan = config.includePortScan !== false ? await performPortScan(ip) : null;
    jobs.set(jobId, { status: 'processing', progress: 60 });
    console.log(`[ASYNC] Port scan completed: ${portScan?.openPorts.length || 0} open ports`);

    // Step 3: Reputation check (if enabled)
    await sleep(2000);
    const reputation = config.includeReputation !== false ? await checkReputation(ip) : null;
    jobs.set(jobId, { status: 'processing', progress: 80 });
    console.log(`[ASYNC] Reputation check completed: score ${reputation?.score || 0}`);

    // Step 4: Find associated domains
    await sleep(2000);
    const domains = await findAssociatedDomains(ip);
    jobs.set(jobId, { status: 'processing', progress: 90 });
    console.log(`[ASYNC] Associated domains found: ${domains.length}`);

    // Build result
    const result: TransformResult = {
      entities: [],
      edges: [],
    };

    // Add domains
    domains.forEach((domain) => {
      const domainId = `domain-${domain}`;
      result.entities.push({
        type: 'domain',
        value: domain,
        properties: {
          source: 'reverse-dns',
        },
      });
      result.edges.push({
        from: ip,
        to: domainId,
        label: 'resolves_to',
      });
    });

    // Add note with detailed analysis
    const noteId = `note-scan-${ip}`;
    let content = `## Deep Scan Results for ${ip}\n\n`;

    if (reverseDns.length > 0) {
      content += `### Reverse DNS\n${reverseDns.map((d) => `- ${d}`).join('\n')}\n\n`;
    }

    if (portScan) {
      content += `### Open Ports\n${portScan.openPorts.map((p) => `- Port ${p}`).join('\n')}\n\n`;
      if (portScan.services.length > 0) {
        content += `### Detected Services\n${portScan.services.map((s) => `- ${s}`).join('\n')}\n\n`;
      }
    }

    if (reputation) {
      content += `### Reputation\n`;
      content += `- **Score**: ${reputation.score}/100\n`;
      content += `- **Category**: ${reputation.category}\n`;
      if (reputation.threats && reputation.threats.length > 0) {
        content += `- **Threats**: ${reputation.threats.join(', ')}\n`;
      }
      content += `\n`;
    }

    content += `**Scan Duration**: ~2 minutes\n`;
    content += `**Source**: Deep Scan Plugin (example)\n`;

    result.entities.push({
      type: 'note',
      value: `Deep Scan: ${ip}`,
      properties: {
        content,
        tags: ['deep-scan', 'security', 'network'],
      },
    });
    result.edges.push({
      from: ip,
      to: noteId,
      label: 'has_analysis',
    });

    // Update job status
    jobs.set(jobId, { status: 'completed', progress: 100 });

    // Send webhook
    console.log(`[ASYNC] Sending success webhook for job ${jobId}`);
    await sendSuccessWebhook(callbackUrl, jobId, result, secret);

    console.log(`[ASYNC] Job ${jobId} completed successfully`);
  } catch (error) {
    console.error(`[ASYNC] Job ${jobId} failed:`, error);
    jobs.set(jobId, { status: 'failed', progress: 0 });

    // Send failure webhook
    await sendFailureWebhook(
      callbackUrl,
      jobId,
      {
        code: 'SCAN_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      secret
    );
  }
}

/**
 * Mock reverse DNS lookup
 */
async function performReverseDNS(ip: string): Promise<string[]> {
  // In production, use dns.reverse() or external API
  return [
    `host-${ip.replace(/\./g, '-')}.example.com`,
    `mail.example.com`,
  ];
}

/**
 * Mock port scan
 */
async function performPortScan(ip: string): Promise<{
  openPorts: number[];
  services: string[];
}> {
  // In production, use nmap or similar tool
  return {
    openPorts: [80, 443, 22],
    services: ['HTTP', 'HTTPS', 'SSH'],
  };
}

/**
 * Mock reputation check
 */
async function checkReputation(ip: string): Promise<{
  score: number;
  category: string;
  threats?: string[];
}> {
  // In production, use VirusTotal, AbuseIPDB, etc.
  const score = Math.floor(Math.random() * 100);
  return {
    score,
    category: score > 70 ? 'clean' : score > 40 ? 'suspicious' : 'malicious',
    threats: score < 40 ? ['spam', 'port-scan'] : [],
  };
}

/**
 * Mock associated domains finder
 */
async function findAssociatedDomains(ip: string): Promise<string[]> {
  // In production, use reverse IP lookup services
  return [
    'example.com',
    'test.example.com',
    `app-${ip.split('.')[3]}.example.com`,
  ];
}

/**
 * Utility: sleep
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get job status endpoint
 */
export function getJobStatus(req: Request, res: Response): void {
  const { jobId } = req.params;
  const job = jobs.get(jobId);

  if (!job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }

  res.json(job);
}

