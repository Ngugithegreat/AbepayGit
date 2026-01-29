import { Wallet } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <Wallet className="h-8 w-8 text-primary" />
      <h1 className="text-2xl font-bold text-foreground group-data-[collapsible=icon]:hidden">DerivPay</h1>
    </div>
  );
}
