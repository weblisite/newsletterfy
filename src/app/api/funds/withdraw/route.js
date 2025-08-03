import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const data = await req.json();
    const { amount, methodId } = data;

    // Start a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get user's current balance
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { availableBalance: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (user.availableBalance < amount) {
        throw new Error('Insufficient funds');
      }

      // Get withdrawal method
      const method = await tx.withdrawalMethod.findUnique({
        where: {
          id: methodId,
          userId, // Ensure the method belongs to the user
        },
      });

      if (!method) {
        throw new Error('Withdrawal method not found');
      }

      // Create withdrawal transaction
      const transaction = await tx.transaction.create({
        data: {
          userId,
          type: 'withdrawal',
          amount: -amount,
          status: 'pending', // Initially set as pending
          withdrawalMethodId: methodId,
        },
      });

      // Update user's balance
      await tx.user.update({
        where: { id: userId },
        data: {
          availableBalance: {
            decrement: amount,
          },
          withdrawnAmount: {
            increment: amount,
          },
        },
      });

      // Here you would typically initiate the actual transfer
      // through your payment processor (PayPal, bank transfer, etc.)
      // For now, we'll just simulate it

      // Update transaction status to completed
      // In production, this would be done by a webhook
      await tx.transaction.update({
        where: { id: transaction.id },
        data: { status: 'completed' },
      });

      return transaction;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process withdrawal' },
      { status: error.message === 'Insufficient funds' ? 400 : 500 }
    );
  }
} 