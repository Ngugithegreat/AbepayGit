'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// We are defining the data structure of the messages that will be exchanged in the chat.
const messageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

export const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    // The input to this flow is a list of messages.
    inputSchema: z.object({
      history: z.array(messageSchema),
      // The last message from the user.
      message: z.string(),
    }),
    // The output is a string, which is the model's response.
    outputSchema: z.string(),
  },
  async (input) => {
    // We are using the Gemini Pro model for this chat.
    const model = 'googleai/gemini-1.5-flash';

    // Call the model with the chat history.
    const response = await ai.generate({
      model,
      // We combine the history with the new message from the user.
      prompt: [
        {
          role: 'system',
          content: `You are a helpful support assistant for ABEPAY, a Deriv Payment Agent service in Kenya. You help users with deposits via M-Pesa, withdrawals to M-Pesa, linking their Deriv accounts, and general app usage.

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
- Contact support`,
        },
        ...input.history,
        { role: 'user', content: input.message },
      ],
      // We are not using any advanced features like tools or output formatting.
      config: {
        // Temperature controls the "creativity" of the model.
        temperature: 0.5,
      },
    });

    // We return the text content of the response.
    return response.text;
  }
);
