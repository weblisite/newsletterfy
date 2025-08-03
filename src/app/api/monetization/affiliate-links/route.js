import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';

// GET /api/monetization/affiliate-links
export async function GET(req) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: affiliateLinks, error } = await supabase
      .from('affiliate_links')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ affiliateLinks });
  } catch (error) {
    console.error('Error fetching affiliate links:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/monetization/affiliate-links
export async function POST(req) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, code, description, category } = await req.json();
    const referralCode = code || nanoid(8);

    const { data: affiliateLink, error } = await supabase
      .from('affiliate_links')
      .insert([{
        user_id: session.user.id,
        name,
        code: referralCode,
        description,
        category,
        clicks: 0,
        conversions: 0,
        revenue: 0,
        url: `${process.env.NEXT_PUBLIC_BASE_URL}/signup?ref=${referralCode}`
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ affiliateLink });
  } catch (error) {
    console.error('Error creating affiliate link:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Update an affiliate link
export async function PATCH(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const { id, ...updateData } = data;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing link ID' },
        { status: 400 }
      );
    }

    // Ensure the link belongs to the user
    const existingLink = await prisma.affiliateLink.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingLink) {
      return NextResponse.json(
        { error: 'Affiliate link not found' },
        { status: 404 }
      );
    }

    // If code is being updated, check if new code is available
    if (updateData.code && updateData.code !== existingLink.code) {
      const codeExists = await prisma.affiliateLink.findFirst({
        where: { code: updateData.code },
      });

      if (codeExists) {
        return NextResponse.json(
          { error: 'Affiliate code already in use' },
          { status: 400 }
        );
      }

      // Update URL with new code
      updateData.url = `${process.env.NEXT_PUBLIC_BASE_URL}/?ref=${updateData.code}`;
    }

    // Update the link
    const affiliateLink = await prisma.affiliateLink.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(affiliateLink);
  } catch (error) {
    console.error('Error updating affiliate link:', error);
    return NextResponse.json(
      { error: 'Failed to update affiliate link' },
      { status: 500 }
    );
  }
}

// Delete an affiliate link
export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing link ID' },
        { status: 400 }
      );
    }

    // Ensure the link belongs to the user
    const existingLink = await prisma.affiliateLink.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingLink) {
      return NextResponse.json(
        { error: 'Affiliate link not found' },
        { status: 404 }
      );
    }

    // Check if the link has any conversions
    if (existingLink.conversions > 0) {
      return NextResponse.json(
        { error: 'Cannot delete link with conversion history' },
        { status: 400 }
      );
    }

    // Delete the link
    await prisma.affiliateLink.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting affiliate link:', error);
    return NextResponse.json(
      { error: 'Failed to delete affiliate link' },
      { status: 500 }
    );
  }
} 