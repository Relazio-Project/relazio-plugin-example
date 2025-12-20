import { signWebhook, verifyWebhookSignature } from './utils/hmac.js';

const secret = 'test-secret-12345';
const payload = JSON.stringify({
  jobId: 'test-job-123',
  status: 'completed',
  result: {
    entities: [],
    edges: [],
  },
});

console.log('🔐 Testing HMAC Signature\n');
console.log('Secret:', secret);
console.log('Payload:', payload);
console.log('');

const signature = signWebhook(payload, secret);
console.log('✅ Generated signature:', signature);
console.log('');

const isValid = verifyWebhookSignature(payload, signature, secret);
console.log('✅ Signature verification:', isValid ? 'VALID' : 'INVALID');
console.log('');

const wrongSignature = 'sha256=wrong1234567890';
const isInvalid = verifyWebhookSignature(payload, wrongSignature, secret);
console.log('❌ Wrong signature verification:', isInvalid ? 'VALID' : 'INVALID (expected)');

