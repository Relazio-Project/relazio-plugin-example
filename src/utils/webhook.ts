import fetch from 'node-fetch';
import { signWebhook } from './hmac.js';
import type { WebhookPayload } from '../types.js';

/**
 * Send a webhook to Relazio platform
 * 
 * @param callbackUrl - The callback URL from the transform request
 * @param payload - The webhook payload
 * @param secret - The webhook secret
 */
export async function sendWebhook(
  callbackUrl: string,
  payload: WebhookPayload,
  secret: string
): Promise<void> {
  const body = JSON.stringify(payload);
  const signature = signWebhook(body, secret);

  console.log(`[WEBHOOK] Sending to ${callbackUrl}`, {
    jobId: payload.jobId,
    status: payload.status,
  });

  try {
    const response = await fetch(callbackUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Plugin-Signature': signature,
        'User-Agent': 'Relazio-Plugin-Example/1.0',
      },
      body,
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
    }

    console.log(`[WEBHOOK] Success: ${response.status}`);
  } catch (error) {
    console.error('[WEBHOOK] Error:', error);
    throw error;
  }
}

/**
 * Send a successful webhook
 */
export async function sendSuccessWebhook(
  callbackUrl: string,
  jobId: string,
  result: WebhookPayload['result'],
  secret: string
): Promise<void> {
  await sendWebhook(
    callbackUrl,
    {
      jobId,
      status: 'completed',
      result,
    },
    secret
  );
}

/**
 * Send a failed webhook
 */
export async function sendFailureWebhook(
  callbackUrl: string,
  jobId: string,
  error: { code: string; message: string },
  secret: string
): Promise<void> {
  await sendWebhook(
    callbackUrl,
    {
      jobId,
      status: 'failed',
      error,
    },
    secret
  );
}

