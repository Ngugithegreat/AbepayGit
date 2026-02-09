'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const messageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const systemPrompt = `You are a helpful support assistant for ABEPAY, a Deriv Payment Agent service in Kenya. You help users with deposits via M-Pesa, withdrawals to M-Pesa, linking their Deriv accounts, and general app usage.

Exchange rates:
- Deposits: 130 KES = 1 USD
- Withdrawals: 124 KES = 1 USD

Transaction limits: $1 - $5,000 USD

You ONLY answer questions related to ABEPAY services. For questions outside this scope, politely explain that you can only help with ABEPAY-related queries. For contact information, provide the support email: support@abepay.com.

Common topics you help with:
- How to deposit funds
- How to withdraw funds
- Linking/unlinking Deriv account
- Exchange rates and fees
- Transaction limits
- Troubleshooting deposit/withdrawal issues
- Account verification
- Contact support`;

export const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: z.object({
      history: z.array(messageSchema),
      message: z.string(),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    const model = 'googleai/gemini-1.5-flash';

    const response = await ai.generate({
      model,
      system: systemPrompt,
      prompt: input.message,
      history: input.history,
      config: {
        temperature: 0.5,
      },
    });

    return response.text;
  }
);