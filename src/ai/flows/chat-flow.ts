'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit/zod';

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
          content: 'You are a helpful AI assistant for an app called AbePay. AbePay helps users deposit and withdraw funds from their Deriv account using M-Pesa. Your role is to answer questions about how to use the app. Be friendly and concise.',
        },
        ...input.history,
        { role: 'user', content: input.message },
      ],
      // We are not using any advanced features like tools or output formatting.
      config: {
        // Temperature controls the "creativity" of the model.
        temperature: 0.7,
      },
    });

    // We return the text content of the response.
    return response.text;
  }
);
