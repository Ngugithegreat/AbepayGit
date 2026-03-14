import { z } from 'zod';

export const depositSchema = z.object({
  phone: z.string()
    .min(1, { message: 'Phone number is required.' })
    .regex(/^(?:254|\+254|0)?([17]\d{8})$/, 'Please enter a valid Kenyan phone number.'),
  amount: z.coerce.number({invalid_type_error: "Please enter a valid amount"})
    .min(130, 'Minimum deposit is 130 KES')
    .max(260000, 'Maximum deposit is 260,000 KES'),
});

export const withdrawSchema = z.object({
  amount: z.coerce.number()
    .min(1, 'Minimum withdrawal is $1 USD')
    .max(2000, 'Maximum withdrawal is $2,000 USD'),
  phone: z.string()
    .min(1, { message: 'Phone number is required.' })
    .regex(/^(?:254|\+254|0)?([17]\d{8})$/, 'Please enter a valid Kenyan phone number.'),
  verificationCode: z.string().optional(), // Made optional as 2FA is not yet implemented
});
