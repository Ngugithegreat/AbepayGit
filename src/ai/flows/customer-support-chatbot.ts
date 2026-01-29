'use server';

/**
 * @fileOverview Customer support chatbot flow that answers user questions about deposits using Deriv documentation.
 *
 * - customerSupportChatbot - A function that handles the chatbot interactions.
 * - CustomerSupportChatbotInput - The input type for the customerSupportChatbot function.
 * - CustomerSupportChatbotOutput - The return type for the customerSupportChatbot function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CustomerSupportChatbotInputSchema = z.object({
  question: z.string().describe('The user question about deposits.'),
});
export type CustomerSupportChatbotInput = z.infer<typeof CustomerSupportChatbotInputSchema>;

const CustomerSupportChatbotOutputSchema = z.object({
  answer: z.string().describe('The chatbot answer to the user question.'),
});
export type CustomerSupportChatbotOutput = z.infer<typeof CustomerSupportChatbotOutputSchema>;

export async function customerSupportChatbot(input: CustomerSupportChatbotInput): Promise<CustomerSupportChatbotOutput> {
  return customerSupportChatbotFlow(input);
}

const prompt = ai.definePrompt({
  name: 'customerSupportChatbotPrompt',
  input: {schema: CustomerSupportChatbotInputSchema},
  output: {schema: CustomerSupportChatbotOutputSchema},
  prompt: `You are a customer support chatbot for Deriv, a platform for online trading.
  Your goal is to answer user questions about deposits in a helpful and informative manner, using the provided Deriv documentation, deposit tutorials, and troubleshooting guides.
  Generate appropriate responses and guides for a variety of deposit problems.

  User Question: {{{question}}}

  Here are some relevant documents:
  - [Deriv Documentation on Deposits](https://deriv.com/dbot/help-centre/cashier/depositing/)
  - [Deriv Deposit Tutorials](https://www.youtube.com/playlist?list=PL6NCOQJkI_J-j9F2QwDjk_jImx9cOnp9c)
  - [Deriv Troubleshooting Guides](https://community.deriv.com/c/troubleshooting/14)
  `,
});

const customerSupportChatbotFlow = ai.defineFlow(
  {
    name: 'customerSupportChatbotFlow',
    inputSchema: CustomerSupportChatbotInputSchema,
    outputSchema: CustomerSupportChatbotOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
