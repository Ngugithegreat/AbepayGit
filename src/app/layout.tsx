'use client';

import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/context/auth-context';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const appId = process.env.NEXT_PUBLIC_DERIV_APP_ID;

  if (!appId) {
    return (
      <html lang="en" className="dark">
        <head>
          <title>Configuration Error</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        </head>
        <body className="bg-slate-900 text-slate-200">
          <div className="flex h-screen w-full items-center justify-center bg-slate-900 text-center p-4">
            <div className="p-8 glass-effect rounded-xl max-w-lg">
              <h1 className="text-2xl font-bold text-red-500 mb-4">Configuration Error</h1>
              <p className="text-slate-300">The Deriv App ID is missing.</p>
              <p className="text-slate-400 mt-2">
                Please add the environment variable <code className="bg-slate-800 border border-slate-700 p-1 rounded-md text-amber-400">NEXT_PUBLIC_DERIV_APP_ID</code> to your <code className="bg-slate-800 border border-slate-700 p-1 rounded-md text-amber-400">.env.local</code> file and restart the development server.
              </p>
            </div>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <title>Abepay</title>
        <meta name="description" content="Instant deposits and withdrawals" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" crossOrigin="anonymous" referrerPolicy="no-referrer" />
        <script src="https://cdn.jsdelivr.net/npm/chart.js" async></script>
      </head>
      <body suppressHydrationWarning={true}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
