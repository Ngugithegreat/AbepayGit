// M-Pesa Daraja API Configuration
// This file contains all M-Pesa credentials and helper functions

export const MPESA_CONFIG = {
  // Sandbox credentials (for testing)
  SANDBOX: {
    CONSUMER_KEY: 'bCGR2Chy7fYP33xVAE76Act2DkZgldut',
    CONSUMER_SECRET: '7seqLATsgmmvpkAa',
    SHORTCODE: '174379',
    PASSKEY: 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919',
    AUTH_URL: 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    STK_PUSH_URL: 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
  },
  
  // Production credentials (for live - use when ready)
  PRODUCTION: {
    CONSUMER_KEY: 'bCGR2Chy7fYP33xVAE76Act2DkZgldut', // Same for now
    CONSUMER_SECRET: '7seqLATsgmmvpkAa', // Same for now
    SHORTCODE: '4098227', // Your real paybill
    PASSKEY: '', // Get from Safaricom when going live
    AUTH_URL: 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    STK_PUSH_URL: 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
  },
  
  // Current environment (change to 'PRODUCTION' when ready to go live)
  CURRENT_ENV: 'SANDBOX' as 'SANDBOX' | 'PRODUCTION',
  
  // Callback URL (where M-Pesa sends payment confirmation)
  CALLBACK_URL: 'https://9000-firebase-studio-1769728259584.cluster-64pjnskmlbaxowh5lzq6i7v4ra.cloudworkstations.dev/api/mpesa/callback',
  
  // Transaction descriptions
  ACCOUNT_REFERENCE: 'ABEPAY',
  TRANSACTION_DESC: 'Deriv Deposit via ABEPAY',
};

// Get current environment config
export function getMpesaConfig() {
  return MPESA_CONFIG[MPESA_CONFIG.CURRENT_ENV];
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
