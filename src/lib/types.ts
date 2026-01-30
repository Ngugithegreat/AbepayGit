export type Transaction = {
  id: string;
  date: string;
  amount: number;
  currency: 'USD';
  status: 'Completed' | 'Pending' | 'Failed';
  type: 'Deposit' | 'Withdrawal';
};
