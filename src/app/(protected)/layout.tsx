'use client';

import { AppLayout } from '@/components/app-layout';

// This layout component provides the navigation and structure for all protected pages.
// Authentication is now handled on a per-page basis to avoid layout-level race conditions.
export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
