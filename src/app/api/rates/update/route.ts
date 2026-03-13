import { NextRequest, NextResponse } from 'next/server';
import { setDepositRate, setWithdrawRate } from '@/lib/exchange-rates';

export async function POST(request: NextRequest) {
  try {
    const { depositRate, withdrawRate } = await request.json();

    if (depositRate) {
      await setDepositRate(Number(depositRate));
    }

    if (withdrawRate) {
      await setWithdrawRate(Number(withdrawRate));
    }

    return NextResponse.json({
      success: true,
      message: 'Rates updated successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
