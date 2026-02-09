'use server';

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const GENKIT_ENV = process.env.GENKIT_ENV || 'dev';

export const ai = genkit({
  plugins: [
    googleAI({
      apiVersion: 'v1beta',
      apiKey: process.env.GOOGLE_AI_API_KEY,
    }),
  ],
  logSinks: [],
  enableTracingAndMetrics: GENKIT_ENV === 'prod',
});
