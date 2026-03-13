import { NextResponse } from 'next/server';
import { getDepositRate, getWithdrawRate } from '@/lib/exchange-rates';

export async function GET() {
  try {
    const depositRate = await getDepositRate();
    const withdrawRate = await getWithdrawRate();

    return NextResponse.json({
      success: true,
      depositRate,
      withdrawRate,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
