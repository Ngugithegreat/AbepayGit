import type { Transaction } from './types';

export const transactions: Transaction[] = [
  {
    id: 'TXN789012',
    date: '2024-07-21T10:00:00Z',
    amount: 100,
    currency: 'USD',
    status: 'Completed',
  },
  {
    id: 'TXN456789',
    date: '2024-07-20T15:30:00Z',
    amount: 50,
    currency: 'USD',
    status: 'Completed',
  },
  {
    id: 'TXN123456',
    date: '2024-07-19T09:05:00Z',
    amount: 250,
    currency: 'USD',
    status: 'Failed',
  },
  {
    id: 'TXN987654',
    date: '2024-07-18T18:45:00Z',
    amount: 75,
    currency: 'USD',
    status: 'Completed',
  },
  {
    id: 'TXN654321',
    date: '2024-07-17T11:20:00Z',
    amount: 120,
    currency: 'USD',
    status: 'Pending',
  },
];
