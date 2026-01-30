export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout has NO auth checking - it's purely for auth flows
  return <>{children}</>;
}
