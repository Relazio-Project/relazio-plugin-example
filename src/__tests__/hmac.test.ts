import { describe, it, expect } from 'vitest';
import { signWebhook, verifyWebhookSignature } from '../utils/hmac.js';

describe('HMAC Utilities', () => {
  const secret = 'test-secret-12345';
  const payload = JSON.stringify({
    jobId: 'test-123',
    status: 'completed',
    result: { entities: [], edges: [] },
  });

  it('should generate a valid HMAC signature', () => {
    const signature = signWebhook(payload, secret);
    expect(signature).toMatch(/^sha256=[a-f0-9]{64}$/);
  });

  it('should verify a correct signature', () => {
    const signature = signWebhook(payload, secret);
    const isValid = verifyWebhookSignature(payload, signature, secret);
    expect(isValid).toBe(true);
  });

  it('should reject an incorrect signature', () => {
    const wrongSignature = 'sha256=wrong1234567890abcdef';
    const isValid = verifyWebhookSignature(payload, wrongSignature, secret);
    expect(isValid).toBe(false);
  });

  it('should reject a signature with wrong secret', () => {
    const signature = signWebhook(payload, secret);
    const isValid = verifyWebhookSignature(payload, signature, 'wrong-secret');
    expect(isValid).toBe(false);
  });

  it('should reject a signature with modified payload', () => {
    const signature = signWebhook(payload, secret);
    const modifiedPayload = payload + ' ';
    const isValid = verifyWebhookSignature(modifiedPayload, signature, secret);
    expect(isValid).toBe(false);
  });

  it('should be consistent across multiple calls', () => {
    const sig1 = signWebhook(payload, secret);
    const sig2 = signWebhook(payload, secret);
    expect(sig1).toBe(sig2);
  });
});

