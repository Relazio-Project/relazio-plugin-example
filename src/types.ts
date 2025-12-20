// TypeScript types for Relazio Plugin API

export interface Entity {
  type: string;
  value: string;
  properties?: Record<string, unknown>;
}

export interface Edge {
  from: string;
  to: string;
  label?: string;
  properties?: Record<string, unknown>;
}

export interface TransformResult {
  entities: Entity[];
  edges: Edge[];
}

export interface TransformInput {
  entity: Entity;
  config: Record<string, unknown>;
}

export interface TransformRequest {
  transformId: string;
  input: TransformInput;
  callbackUrl: string;
}

export interface SyncTransformResponse {
  async: false;
  result: TransformResult;
}

export interface AsyncTransformResponse {
  async: true;
  jobId: string;
  estimatedTime?: number;
}

export type TransformResponse = SyncTransformResponse | AsyncTransformResponse;

export interface WebhookPayload {
  jobId: string;
  status: 'completed' | 'failed';
  result?: TransformResult;
  error?: {
    code: string;
    message: string;
  };
}

export interface Transform {
  id: string;
  name: string;
  description?: string;
  inputType: string;
  outputTypes: string[];
  endpoint: string;
  method: 'POST';
  async: boolean;
  configSchema?: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface PluginManifest {
  manifestVersion: '1.0';
  plugin: {
    id: string;
    name: string;
    version: string;
    description?: string;
    author: string;
    homepage?: string;
    icon?: string;
    category: string;
    tags?: string[];
    capabilities: {
      inputTypes: string[];
      outputTypes: string[];
      supportsAsync: boolean;
    };
    transforms: Transform[];
    rateLimit?: {
      maxRequestsPerMinute: number;
    };
  };
}

// IP Lookup specific types
export interface IPInfo {
  ip: string;
  country?: string;
  region?: string;
  city?: string;
  loc?: string; // latitude,longitude
  org?: string;
  postal?: string;
  timezone?: string;
  asn?: string;
}

export interface DeepScanResult {
  ip: string;
  reverseDns?: string[];
  openPorts?: number[];
  services?: string[];
  reputation?: {
    score: number;
    category: string;
  };
  threats?: string[];
  associatedDomains?: string[];
}

// Registration & Multi-tenant types
export interface RegistrationRequest {
  organizationId: string;
  organizationName?: string;
  platformUrl: string;
  platformVersion?: string;
}

export interface RegistrationResponse {
  webhookSecret: string;
  pluginId: string;
  version: string;
  message: string;
}

export interface Installation {
  organizationId: string;
  webhookSecret: string;
  platformUrl: string;
  installedAt: Date;
  lastUsed?: Date;
}

