import crypto from 'crypto';

/**
 * Sign a webhook payload with HMAC-SHA256
 * 
 * @param payload - The JSON payload as string
 * @param secret - The webhook secret from Relazio platform
 * @returns The signature in format "sha256=hex"
 */
export function signWebhook(payload: string, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  return `sha256=${hmac.digest('hex')}`;
}

/**
 * Verify a webhook signature
 * 
 * @param payload - The JSON payload as string
 * @param signature - The signature from X-Plugin-Signature header
 * @param secret - The webhook secret
 * @returns True if signature is valid
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = signWebhook(payload, secret);
  
  // Use timingSafeEqual to prevent timing attacks
  try {
    const expectedBuffer = Buffer.from(expectedSignature);
    const actualBuffer = Buffer.from(signature);
    
    if (expectedBuffer.length !== actualBuffer.length) {
      return false;
    }
    
    return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
  } catch {
    return false;
  }
}

