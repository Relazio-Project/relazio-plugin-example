import type { Request, Response } from 'express';
import type {
  TransformRequest,
  SyncTransformResponse,
  TransformResult,
  Entity,
  IPInfo,
} from '../types.js';

/**
 * Synchronous transform: IP Lookup
 * Returns geolocation and organization info for an IP address
 */
export async function lookupIp(
  req: Request<object, object, TransformRequest>,
  res: Response<SyncTransformResponse>
): Promise<void> {
  const { transformId, input, callbackUrl } = req.body;
  const { entity } = input;

  console.log(`[SYNC] Transform ${transformId} for IP: ${entity.value}`);

  try {
    // Validate input
    if (entity.type !== 'ip') {
      throw new Error(`Invalid entity type: ${entity.type}`);
    }

    // Fetch IP information
    const ipInfo = await fetchIPInfo(entity.value);

    // Build result
    const result: TransformResult = {
      entities: [],
      edges: [],
    };

    // Add location entity if available
    if (ipInfo.country) {
      const locationId = `location-${ipInfo.country}-${ipInfo.city || 'unknown'}`;
      result.entities.push({
        type: 'location',
        value: `${ipInfo.city || 'Unknown'}, ${ipInfo.country}`,
        properties: {
          country: ipInfo.country,
          region: ipInfo.region,
          city: ipInfo.city,
          coordinates: ipInfo.loc,
          postal: ipInfo.postal,
          timezone: ipInfo.timezone,
        },
      });
      result.edges.push({
        from: entity.value,
        to: locationId,
        label: 'located_in',
      });
    }

    // Add organization entity if available
    if (ipInfo.org) {
      const orgId = `org-${ipInfo.org.replace(/\s+/g, '-').toLowerCase()}`;
      result.entities.push({
        type: 'organization',
        value: ipInfo.org,
        properties: {
          asn: ipInfo.asn,
          source: 'ipinfo',
        },
      });
      result.edges.push({
        from: entity.value,
        to: orgId,
        label: 'belongs_to',
      });
    }

    // Add note with summary
    const noteId = `note-ip-${entity.value}`;
    result.entities.push({
      type: 'note',
      value: `IP Info: ${entity.value}`,
      properties: {
        content: `
**IP Address**: ${entity.value}
**Location**: ${ipInfo.city || 'N/A'}, ${ipInfo.region || 'N/A'}, ${ipInfo.country || 'N/A'}
**Organization**: ${ipInfo.org || 'N/A'}
**ASN**: ${ipInfo.asn || 'N/A'}
**Timezone**: ${ipInfo.timezone || 'N/A'}
**Source**: ipinfo.io (example plugin)
        `.trim(),
        tags: ['ip-lookup', 'geolocation'],
      },
    });
    result.edges.push({
      from: entity.value,
      to: noteId,
      label: 'has_info',
    });

    console.log(`[SYNC] Success: ${result.entities.length} entities, ${result.edges.length} edges`);

    res.json({
      async: false,
      result,
    });
  } catch (error) {
    console.error('[SYNC] Error:', error);
    res.status(500).json({
      async: false,
      result: {
        entities: [
          {
            type: 'note',
            value: 'IP Lookup Error',
            properties: {
              content: `Error looking up IP ${entity.value}: ${error instanceof Error ? error.message : 'Unknown error'}`,
              tags: ['error'],
            },
          },
        ],
        edges: [],
      },
    });
  }
}

/**
 * Fetch IP information from ipinfo.io (or mock data)
 */
async function fetchIPInfo(ip: string): Promise<IPInfo> {
  const apiKey = process.env.IPINFO_API_KEY;

  // If no API key, return mock data
  if (!apiKey) {
    console.log('[SYNC] No API key, using mock data');
    return {
      ip,
      country: 'US',
      region: 'California',
      city: 'Mountain View',
      loc: '37.3860,-122.0838',
      org: 'AS15169 Google LLC',
      postal: '94035',
      timezone: 'America/Los_Angeles',
      asn: 'AS15169',
    };
  }

  // Fetch from ipinfo.io
  try {
    const response = await fetch(`https://ipinfo.io/${ip}/json?token=${apiKey}`);
    if (!response.ok) {
      throw new Error(`IPInfo API error: ${response.status}`);
    }
    const data = (await response.json()) as IPInfo;
    return data;
  } catch (error) {
    console.error('[SYNC] IPInfo API error:', error);
    // Fallback to mock data
    return {
      ip,
      country: 'Unknown',
      org: 'Unknown',
    };
  }
}

