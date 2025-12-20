import { manifest } from './manifest.js';
import { z } from 'zod';

// Validation schema (simplified version of Relazio's validator)
const manifestSchema = z.object({
  manifestVersion: z.literal('1.0'),
  plugin: z.object({
    id: z.string().min(3).max(50),
    name: z.string().min(3).max(100),
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    description: z.string().optional(),
    author: z.string(),
    category: z.string(),
    capabilities: z.object({
      inputTypes: z.array(z.string()).min(1),
      outputTypes: z.array(z.string()).min(1),
      supportsAsync: z.boolean(),
    }),
    transforms: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        inputType: z.string(),
        outputTypes: z.array(z.string()).min(1),
        endpoint: z.string().url(),
        method: z.literal('POST'),
        async: z.boolean(),
      })
    ).min(1),
  }),
});

console.log('📋 Validating manifest.json\n');

try {
  manifestSchema.parse(manifest);
  console.log('✅ Manifest is VALID!');
  console.log('');
  console.log('Plugin ID:', manifest.plugin.id);
  console.log('Plugin Name:', manifest.plugin.name);
  console.log('Version:', manifest.plugin.version);
  console.log('Transforms:', manifest.plugin.transforms.length);
  console.log('');
  manifest.plugin.transforms.forEach((t) => {
    console.log(`  - ${t.name} (${t.async ? 'async' : 'sync'})`);
  });
} catch (error) {
  console.error('❌ Manifest is INVALID!');
  console.error(error);
  process.exit(1);
}

