// M-Pesa Daraja API Configuration
// This file contains all M-Pesa credentials and helper functions

export const MPESA_CONFIG = {
  // Sandbox credentials (for testing)
  SANDBOX: {
    CONSUMER_KEY: process.env.MPESA_SANDBOX_CONSUMER_KEY || '',
    CONSUMER_SECRET: process.env.MPESA_SANDBOX_CONSUMER_SECRET || '',
    SHORTCODE: process.env.NEXT_PUBLIC_MPESA_SANDBOX_SHORTCODE || '174379',
    PASSKEY: process.env.MPESA_SANDBOX_PASSKEY || '',
    AUTH_URL: 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    STK_PUSH_URL: 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
  },
  
  // Production credentials (for live - use when ready)
  PRODUCTION: {
    CONSUMER_KEY: process.env.MPESA_PRODUCTION_CONSUMER_KEY || '',
    CONSUMER_SECRET: process.env.MPESA_PRODUCTION_CONSUMER_SECRET || '',
    SHORTCODE: process.env.NEXT_PUBLIC_MPESA_PRODUCTION_SHORTCODE || '',
    PASSKEY: process.env.MPESA_PRODUCTION_PASSKEY || '',
    AUTH_URL: 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    STK_PUSH_URL: 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
  },
  
  // Current environment (change to 'PRODUCTION' when ready to go live)
  CURRENT_ENV: (process.env.MPESA_ENV as 'SANDBOX' | 'PRODUCTION') || 'SANDBOX',
  
  // Callback URL (where M-Pesa sends payment confirmation)
  CALLBACK_URL: process.env.NEXT_PUBLIC_MPESA_CALLBACK_URL || 'https://example.com/api/mpesa/callback',
  
  // Transaction descriptions
  ACCOUNT_REFERENCE: 'ABEPAY',
  TRANSACTION_DESC: 'Deriv Deposit via ABEPAY',
};

// Get current environment config
export function getMpesaConfig() {
  const env = MPESA_CONFIG.CURRENT_ENV;
  const config = MPESA_CONFIG[env];
  
  if(env !== 'PRODUCTION' && (!config.CONSUMER_KEY || !config.CONSUMER_SECRET || !config.PASSKEY)){
      console.warn(`⚠️ WARNING: M-Pesa configuration for ${env} is missing some values. Please check your environment variables.`);
  }

  return config;
}

// Generate M-Pesa password (required for STK Push)
export function generateMpesaPassword(shortcode: string, passkey: string, timestamp: string): string {
  const buffer = Buffer.from(`${shortcode}${passkey}${timestamp}`);
  return buffer.toString('base64');
}

// Generate timestamp in format: YYYYMMDDHHmmss
export function generateTimestamp(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

// Format phone number for M-Pesa (254XXXXXXXXX)
export function formatPhoneNumber(phone: string): string {
  // Remove any spaces, dashes, or special characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If starts with 0, replace with 254
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  }
  
  // If doesn't start with 254, add it
  if (!cleaned.startsWith('254')) {
    cleaned = '254' + cleaned;
  }
  
  return cleaned;
}

// Validate phone number
export function isValidKenyanPhone(phone: string): boolean {
  const formatted = formatPhoneNumber(phone);
  // Kenyan numbers are 12 digits (254 + 9 digits)
  return formatted.length === 12 && formatted.startsWith('254');
}
