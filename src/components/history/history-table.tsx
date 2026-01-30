'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Transaction } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

type HistoryTableProps = {
  transactions: Transaction[];
};

export default function HistoryTable({ transactions }: HistoryTableProps) {
  const getBadgeVariant = (status: Transaction['status']) => {
    switch (status) {
      case 'Completed':
        return 'success';
      case 'Pending':
        return 'secondary';
      case 'Failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>A log of your recent deposit and withdrawal activities.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead className="hidden md:table-cell">Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="text-right">Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                    <TableCell className="font-medium">{transaction.id}</TableCell>
                    <TableCell className="hidden sm:table-cell">{new Date(transaction.date).toLocaleDateString()}</TableCell>
                    <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-2">
                            {transaction.type === 'Deposit' ? <ArrowDownCircle className="h-4 w-4 text-accent" /> : <ArrowUpCircle className="h-4 w-4 text-destructive" />}
                            <span>{transaction.type}</span>
                        </div>
                    </TableCell>
                    <TableCell>${transaction.amount.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                    <Badge variant={getBadgeVariant(transaction.status)}>
                        {transaction.status}
                    </Badge>
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}
