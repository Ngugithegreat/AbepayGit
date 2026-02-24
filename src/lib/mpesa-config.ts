// M-Pesa Daraja API Configuration

export const MPESA_CONFIG = {
  // Production credentials (from environment variables)
  PRODUCTION: {
    CONSUMER_KEY: process.env.MPESA_CONSUMER_KEY || '',
    CONSUMER_SECRET: process.env.MPESA_CONSUMER_SECRET || '',
    SHORTCODE: process.env.MPESA_SHORTCODE || '4098227',
    PASSKEY: process.env.MPESA_PASSKEY || '',
    AUTH_URL: 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    STK_PUSH_URL: 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
  },
  
  // Sandbox credentials (for testing - not used)
  SANDBOX: {
    CONSUMER_KEY: '',
    CONSUMER_SECRET: '',
    SHORTCODE: '174379',
    PASSKEY: 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919',
    AUTH_URL: 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    STK_PUSH_URL: 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
  },
  
  // Current environment (ALWAYS use PRODUCTION)
  CURRENT_ENV: (process.env.MPESA_ENVIRONMENT || 'PRODUCTION') as 'SANDBOX' | 'PRODUCTION',
  
  // Callback URL
  CALLBACK_URL: (process.env.NEXT_PUBLIC_APP_URL || 'https://abepay-git-auib.vercel.app') + '/api/mpesa/callback',
  
  // Transaction details
  ACCOUNT_REFERENCE: 'ABEPAY',
  TRANSACTION_DESC: 'Deriv Deposit via ABEPAY',
};

// Get current environment config
export function getMpesaConfig() {
  // FORCE PRODUCTION if environment variable is set
  const environment = process.env.MPESA_ENVIRONMENT === 'sandbox' ? 'SANDBOX' : 'PRODUCTION';
  
  console.log('🔧 Using environment:', environment);
  
  const config = MPESA_CONFIG[environment];
  
  console.log('🔧 M-Pesa Config Status:', {
    environment: environment,
    shortcode: config.SHORTCODE,
    authUrl: config.AUTH_URL,
    hasConsumerKey: !!config.CONSUMER_KEY && config.CONSUMER_KEY.length > 0,
    hasConsumerSecret: !!config.CONSUMER_SECRET && config.CONSUMER_SECRET.length > 0,
    hasPasskey: !!config.PASSKEY && config.PASSKEY.length > 0,
    consumerKeyLength: config.CONSUMER_KEY?.length,
    consumerSecretLength: config.CONSUMER_SECRET?.length,
    passkeyLength: config.PASSKEY?.length,
  });
  
  // Validate that all required credentials are present
  if (!config.CONSUMER_KEY || config.CONSUMER_KEY.length === 0) {
    throw new Error('MPESA_CONSUMER_KEY is not set in environment variables!');
  }
  if (!config.CONSUMER_SECRET || config.CONSUMER_SECRET.length === 0) {
    throw new Error('MPESA_CONSUMER_SECRET is not set in environment variables!');
  }
  if (!config.PASSKEY || config.PASSKEY.length === 0) {
    throw new Error('MPESA_PASSKEY is not set in environment variables!');
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
