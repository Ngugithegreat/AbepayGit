'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const messageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

// System prompt for ABEPAY
const SYSTEM_PROMPT = `You are a helpful support assistant for ABEPAY, a Deriv Payment Agent service in Kenya. You help users with deposits via M-Pesa, withdrawals to M-Pesa, linking their Deriv accounts, and general app usage.

Exchange rates:
- Deposits: 130 KES = 1 USD
- Withdrawals: 124 KES = 1 USD

Transaction limits: $1 - $5,000 USD

You ONLY answer questions related to ABEPAY services. For questions outside this scope, politely explain that you can only help with ABEPAY-related queries. For contact information, provide the support email: support@abepay.com.

Common topics you help with:
- How to deposit funds via M-Pesa (explain the STK push process)
- How to withdraw funds to M-Pesa
- Linking/unlinking Deriv account
- Exchange rates and fees
- Transaction limits ($1 minimum, $5,000 maximum)
- Troubleshooting deposit/withdrawal issues
- Account verification
- Contact support

Be friendly, concise, and helpful. Always provide step-by-step instructions when explaining processes.`;

// Define the chat flow
export const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: z.object({
      message: z.string(),
      history: z.array(messageSchema).optional(),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    try {
      const model = 'googleai/gemini-1.5-flash-latest';

      // Convert history to the format Genkit expects
      const history =
        input.history?.map((msg) => ({
          role: msg.role,
          content: [{ text: msg.content }],
        })) || [];

      // Generate response using Genkit
      const result = await ai.generate({
        model,
        system: SYSTEM_PROMPT,
        prompt: input.message,
        history: history,
        config: {
          temperature: 0.7,
          maxOutputTokens: 500,
        },
      });

      return result.text;
    } catch (error) {
      console.error('Chat flow error:', error);
      throw new Error('Failed to generate response');
    }
  }
);
