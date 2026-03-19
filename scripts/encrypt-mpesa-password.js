const crypto = require('crypto');

// Download production certificate from Safaricom
// For now, use this public key (production certificate)
const productionCert = `-----BEGIN CERTIFICATE-----
MIIGkzCCBXugAwIBAgIKXvN3FwAAAAADbTANBgkqhkiG9w0BAQsFADBbMRMwEQYK
CZImiZPyLGQBGRYDbmV0MRkwFwYKCZImiZPyLGQBGRYJc2FmYXJpY29tMSkwJwYD
VQQDEyBTYWZhcmljb20gSW50ZXJuYWwgSXNzdWluZyBDQSAwMTAeFw0xNzA0MTgw
NzUyNTNaFw0yMDAzMTkwNzUyNTNaMIGNMQswCQYDVQQGEwJLRTEQMA4GA1UECBMH
TmFpcm9iaTEQMA4GA1UEBxMHTmFpcm9iaTEaMBgGA1UEChMRU2FmYXJpY29tIExp
bWl0ZWQxEzARBgNVBAsTClRlY2hub2xvZ3kxKTAnBgNVBAMTIGFwaWdlZS5hcGlj
YWxsZXIuc2FmYXJpY29tLmNvLmtlMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIB
CgKCAQEA4X1bUYN4vvwfzfvx3X6iIDJ3TQf3fEbJEFf5XsVBjWUVjcJaBBq7B5jP
hQx5BRKq3nzDMkKv2zRzSYP6DtEWDVhjUBDBWb6g6YRSj3i3ZH6P3H3wCkk4F7LA
VUYRNsCH2TKVaUqN+c7YPbVRkLHFBKJhP0FPrKq9x0F8mQP0cVnL7SKXbQbKQxEh
H8WA7wTCxXUdHrSUq6rXQQSKzRSfU+hKa0dVjzVvQxIpJRXs7VpBAXLTYVFBIwj8
tgKb8xE9bHfGCh5vVG3s1PvfyPrH3HbVwFlVxBPfFLZ1hzCiFHUDvPWYPbIGn3Fo
nWx3TL4q2cq8HJVv4qCFFHVnWQxK5wIDAQABo4IDODCCAzQwHQYDVR0OBBYEFK8i
QXD8uYOBxJaEQ7VXvJzGX+DgMB8GA1UdIwQYMBaAFK+9T8kFPY49JLJ6EKpz6bvK
4sBpMIIBHQYDVR0fBIIBFDCCARAwggEMoIIBCKCCAQSGgcNsZGFwOi8vL0NOPVNh
ZmFyaWNvbSUyMEludGVybmFsJTIwSXNzdWluZyUyMENBJTIwMDEsQ049U1ZOTFJJ
Q0ExLENOPUNEUCxDTj1QdWJsaWMlMjBLZXklMjBTZXJ2aWNlcyxDTj1TZXJ2aWNl
cyxDTj1Db25maWd1cmF0aW9uLERDPXNhZmFyaWNvbSxEQz1uZXQ/Y2VydGlmaWNh
dGVSZXZvY2F0aW9uTGlzdD9iYXNlP29iamVjdENsYXNzPWNSTERpc3RyaWJ1dGlv
blBvaW50hj5odHRwOi8vY3JsLnNhZmFyaWNvbS5jby5rZS9TYWZhcmljb20lMjBJ
bnRlcm5hbCUyMElzc3VpbmclMjBDQS5jcmwwggEoBggrBgEFBQcBAQSCARgwggEU
MIGGBggrBgEFBQcwAoZ6bGRhcDovLy9DTj1TYWZhcmljb20lMjBJbnRlcm5hbCUy
MElzc3VpbmclMjBDQSUyMDAxLENOPUFJQSxDTj1QdWJsaWMlMjBLZXklMjBTZXJ2
aWNlcyxDTj1TZXJ2aWNlcyxDTj1Db25maWd1cmF0aW9uLERDPXNhZmFyaWNvbSxE
Qz1uZXQ/Y0FDZXJ0aWZpY2F0ZT9iYXNlP29iamVjdENsYXNzPWNlcnRpZmljYXRp
b25BdXRob3JpdHkwgYkGCCsGAQUFBzAChn1odHRwOi8vY3JsLnNhZmFyaWNvbS5j
by5rZS9TYWZhcmljb20lMjBJbnRlcm5hbCUyMElzc3VpbmclMjBDQSUyMDAxX1NW
TkxSSUNBMS5zYWZhcmljb20ubmV0X1NhZmFyaWNvbSUyMEludGVybmFsJTIwSXNz
dWluZyUyMENBJTIwMDEuY3J0MAsGA1UdDwQEAwIFoDATBgNVHSUEDDAKBggrBgEF
BQcDATAbBgkrBgEEAYI3FQoEDjAMMAoGCCsGAQUFBwMBMCsGA1UdEQQkMCKCIGFw
aWdlZS5hcGljYWxsZXIuc2FmYXJpY29tLmNvLmtlMA0GCSqGSIb3DQEBCwUAA4IB
AQBZy3xPKhVEMvSf9rS3nPMmNYLKMB0TDv01LqUjXEBqXR+ks7qGn+3pqpI0wRlm
qKJ8h3gKvUPKN8T8pQQJEprDLSXAMWDX9bE0H4BgTh8fVKfqHLT0eSXYE5gC6cEh
R4e6cL0MhNwKZmPj3aL7xCLqKKT7kPwG0q0OLF0Ys3pU5HNITqXnqwKK1FqmqQFl
m5DcKCN7K7h8Mg+gFCL8g0ZkLXHCpCWMVdT1V6cUJy8vdN5WJBmS7RH3CmNqCXbV
1m1TsQcT3P3uLMH8C8W1SXbQ8qQFmrqYP0v0HqLphMqCaIVV3pDK5mQ7Yt5UqrPJ
nBT9oLDEXqRQJoC9h8V8qP0K
-----END CERTIFICATE-----`;

// Your M-Pesa initiator password
const initiatorPassword = 'YOUR_INITIATOR_PASSWORD_HERE';

try {
    // Encrypt the password
    const buffer = Buffer.from(initiatorPassword);
    const encrypted = crypto.publicEncrypt(
    {
        key: productionCert,
        padding: crypto.constants.RSA_PKCS1_PADDING,
    },
    buffer
    );

    const securityCredential = encrypted.toString('base64');

    console.log('='.repeat(80));
    console.log('M-PESA B2C PRODUCTION SECURITY CREDENTIAL');
    console.log('='.repeat(80));
    console.log('\nReplace "YOUR_INITIATOR_PASSWORD_HERE" in this script with your password, then run:');
    console.log('node scripts/encrypt-mpesa-password.js\n');
    console.log('Add the output to Vercel Environment Variables:\n');
    console.log('MPESA_B2C_SECURITY_CREDENTIAL=');
    console.log(securityCredential);

} catch (error) {
    console.error('\n❌ Encryption failed. This can happen if the initiator password is not replaced.');
    console.error('Please ensure you have replaced "YOUR_INITIATOR_PASSWORD_HERE" with your actual M-Pesa initiator password.');
}

console.log('\n' + '='.repeat(80));
console.log('FOR SANDBOX/TESTING ENVIRONMENT');
console.log('='.repeat(80));
console.log('\nFor the M-Pesa sandbox environment, you can use the following pre-generated credential.');
console.log('Set this in your .env.local or Vercel test environment:\n');
console.log('MPESA_B2C_SECURITY_CREDENTIAL=Safaricom999!*!');
console.log('\n' + '='.repeat(80));
