import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { creator } = params;

    // For demo purposes, handle the mock user first
    if (creator === "550e8400-e29b-41d4-a716-446655440000") {
      const mockCreator = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "John Doe",
        email: "user@example.com",
        username: "johndoe"
      };
      
      // Return sample donation tiers for demo
      const sampleTiers = [
        {
          id: "tier-1",
          name: "Coffee Supporter",
          amount: 5.00,
          description: "Buy John a coffee to keep the newsletter going!",
          perks: ["Personal thank you email", "Early access to newsletter"],
          status: "active"
        },
        {
          id: "tier-2", 
          name: "Monthly Supporter",
          amount: 25.00,
          description: "Monthly support for consistent quality content",
          perks: ["All Coffee perks", "Monthly exclusive content", "Community access"],
          status: "active"
        },
        {
          id: "tier-3",
          name: "Premium Supporter", 
          amount: 50.00,
          description: "Premium support for high-quality newsletters",
          perks: ["All Monthly perks", "Priority support", "Custom requests"],
          status: "active"
        }
      ];
      
      return NextResponse.json({
        creator: mockCreator,
        tiers: sampleTiers
      });
    }

    // For real users, try to find them in the database
    // Check if it's a UUID (ID) or username
    let creatorQuery = supabase.from('users').select('id, full_name, email, role');
    
    if (creator.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
      creatorQuery = creatorQuery.eq('id', creator);
    } else {
      creatorQuery = creatorQuery.eq('username', creator);
    }

    const { data: creatorData, error: creatorError } = await creatorQuery.single();

    // If user not found in users table, try to find donation tiers directly by user_id
    if (creatorError || !creatorData) {
      // Check if there are donation tiers for this user_id
      const { data: tiers, error: tiersError } = await supabase
        .from('donation_tiers')
        .select('*')
        .eq('user_id', creator)
        .eq('status', 'active')
        .order('amount', { ascending: true });

      if (!tiersError && tiers && tiers.length > 0) {
        // User has tiers but no user record, create a mock one
        const mockCreator = {
          id: creator,
          name: "Newsletter Creator",
          email: "creator@example.com"
        };
        
        return NextResponse.json({
          creator: mockCreator,
          tiers: tiers
        });
      }
      
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    // Fetch active donation tiers for this creator
    const { data: tiers, error: tiersError } = await supabase
      .from('donation_tiers')
      .select('*')
      .eq('user_id', creatorData.id)
      .eq('status', 'active')
      .order('amount', { ascending: true });

    if (tiersError) {
      console.error('Error fetching donation tiers:', tiersError);
      return NextResponse.json({ error: 'Failed to fetch donation tiers' }, { status: 500 });
    }

    return NextResponse.json({
      creator: {
        id: creatorData.id,
        name: creatorData.full_name || 'Newsletter Creator',
        email: creatorData.email
      },
      tiers: tiers || []
    });
  } catch (error) {
    console.error('Error in creator donation API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 