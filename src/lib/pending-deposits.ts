// Temporary in-memory storage for pending deposits
// In production, use a database (Vercel KV, Firestore, etc.)

interface PendingDeposit {
  checkoutRequestID: string;
  derivAccount: string;
  phoneNumber: string;
  kesAmount: number;
  timestamp: number;
}

const pendingDeposits = new Map<string, PendingDeposit>();

export function storePendingDeposit(deposit: PendingDeposit) {
  pendingDeposits.set(deposit.checkoutRequestID, deposit);
  console.log('📝 Stored pending deposit:', deposit);
}

export function getPendingDeposit(checkoutRequestID: string): PendingDeposit | undefined {
  return pendingDeposits.get(checkoutRequestID);
}

export function removePendingDeposit(checkoutRequestID: string) {
  pendingDeposits.delete(checkoutRequestID);
  console.log('🗑️ Removed pending deposit:', checkoutRequestID);
}

export function getAllPendingDeposits(): PendingDeposit[] {
  return Array.from(pendingDeposits.values());
}
