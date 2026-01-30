export type Transaction = {
  id: string;
  date: string;
  amount: number;
  currency: 'USD';
  status: 'Completed' | 'Pending' | 'Failed';
  type: 'Deposit' | 'Withdrawal';
};

export type DerivAccount = {
  loginid: string;
  is_virtual: number;
  currency: string;
  balance: number;
};

export type DerivUser = {
  fullname: string;
  email: string;
  loginid: string;
  account_list: DerivAccount[];
  balance: number;
  currency: string;
};
