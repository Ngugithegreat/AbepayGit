'use server';

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const GENKIT_ENV = process.env.GENKIT_ENV || 'dev';

export const ai = genkit({
  plugins: [
    googleAI({
      apiVersion: 'v1beta',
    }),
  ],
  logSinks: [],
  enableTracingAndMetrics: GENKIT_ENV === 'prod',
});
