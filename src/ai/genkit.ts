import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const apiKey = process.env.GOOGLE_AI_API_KEY;
if (!apiKey) {
  throw new Error('The GOOGLE_AI_API_KEY environment variable is not set. The chatbot cannot be initialized.');
}

const GENKIT_ENV = process.env.GENKIT_ENV || 'dev';

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: apiKey,
    }),
  ],
  logSinks: [],
  enableTracingAndMetrics: false,
});
