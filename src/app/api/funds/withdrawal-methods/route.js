import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Add new withdrawal method
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const data = await req.json();

    // If this is the first method, make it default
    const existingMethods = await prisma.withdrawalMethod.count({
      where: { userId },
    });

    const method = await prisma.withdrawalMethod.create({
      data: {
        userId,
        type: data.type,
        name: data.type === 'bank_transfer' ? 'Bank Transfer' : 'PayPal',
        accountNumber: data.accountNumber,
        accountName: data.accountName,
        bankName: data.bankName,
        routingNumber: data.routingNumber,
        isDefault: existingMethods === 0,
      },
    });

    return NextResponse.json(method);
  } catch (error) {
    console.error('Error adding withdrawal method:', error);
    return NextResponse.json(
      { error: 'Failed to add withdrawal method' },
      { status: 500 }
    );
  }
}

// Update withdrawal method (set as default)
export async function PATCH(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const data = await req.json();
    const { methodId } = data;

    // Remove default from all methods
    await prisma.withdrawalMethod.updateMany({
      where: { userId },
      data: { isDefault: false },
    });

    // Set new default
    const method = await prisma.withdrawalMethod.update({
      where: {
        id: methodId,
        userId, // Ensure the method belongs to the user
      },
      data: { isDefault: true },
    });

    return NextResponse.json(method);
  } catch (error) {
    console.error('Error updating withdrawal method:', error);
    return NextResponse.json(
      { error: 'Failed to update withdrawal method' },
      { status: 500 }
    );
  }
}

// Delete withdrawal method
export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const methodId = searchParams.get('id');

    const method = await prisma.withdrawalMethod.delete({
      where: {
        id: methodId,
        userId, // Ensure the method belongs to the user
      },
    });

    // If deleted method was default, set another method as default
    if (method.isDefault) {
      const anotherMethod = await prisma.withdrawalMethod.findFirst({
        where: { userId },
      });

      if (anotherMethod) {
        await prisma.withdrawalMethod.update({
          where: { id: anotherMethod.id },
          data: { isDefault: true },
        });
      }
    }

    return NextResponse.json(method);
  } catch (error) {
    console.error('Error deleting withdrawal method:', error);
    return NextResponse.json(
      { error: 'Failed to delete withdrawal method' },
      { status: 500 }
    );
  }
} 