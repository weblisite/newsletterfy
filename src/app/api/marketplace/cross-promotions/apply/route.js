import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// POST: Apply for a cross-promotion
export async function POST(req) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw new Error('Unauthorized');

    // Get the promotion ID from the request
    const { promotionId } = await req.json();

    // Get the promotion details and newsletter info
    const { data: promotion, error: promotionError } = await supabase
      .from('cross_promotions')
      .select(`
        *,
        newsletters:newsletter_id (
          name:newsletter_name,
          subscribers:subscriber_count,
          open_rate
        )
      `)
      .eq('id', promotionId)
      .single();

    if (promotionError) throw promotionError;
    if (!promotion) {
      return NextResponse.json(
        { error: 'Promotion not found' },
        { status: 404 }
      );
    }

    // Get applicant's newsletter info
    const { data: applicantNewsletter, error: newsletterError } = await supabase
      .from('newsletters')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (newsletterError) throw newsletterError;
    if (!applicantNewsletter) {
      return NextResponse.json(
        { error: 'You must have a newsletter to apply for promotions' },
        { status: 400 }
      );
    }

    // Check if user has already applied
    const { data: existingApplication, error: applicationError } = await supabase
      .from('promotion_applications')
      .select('*')
      .eq('promotion_id', promotionId)
      .eq('applicant_id', user.id)
      .single();

    if (existingApplication) {
      return NextResponse.json(
        { error: 'You have already applied for this promotion' },
        { status: 400 }
      );
    }

    // Create the application
    const { data: application, error } = await supabase
      .from('promotion_applications')
      .insert([
        {
          promotion_id: promotionId,
          applicant_id: user.id,
          applicant_newsletter_id: applicantNewsletter.id,
          promotion_owner_id: promotion.user_id,
          status: 'pending',
          applicant_newsletter_name: applicantNewsletter.newsletter_name,
          applicant_subscriber_count: applicantNewsletter.subscriber_count,
          applicant_open_rate: applicantNewsletter.open_rate,
          promotion_newsletter_name: promotion.newsletters.name,
          price_per_subscriber: promotion.price_per_subscriber,
          daily_budget: promotion.daily_budget,
          total_budget: promotion.total_budget
        }
      ])
      .select()
      .single();

    if (error) throw error;

    // Send notification to promotion owner (implement this in a real app)
    // await notifyPromotionOwner(promotion.user_id, {
    //   type: 'new_application',
    //   promotionId,
    //   applicantNewsletter: applicantNewsletter.newsletter_name
    // });

    return NextResponse.json({ 
      success: true,
      message: 'Application submitted successfully',
      application 
    });
  } catch (error) {
    console.error('Error applying for promotion:', error);
    return NextResponse.json(
      { error: 'Failed to apply for promotion' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

// GET: Get application status
export async function GET(req) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw new Error('Unauthorized');

    // Get the promotion ID from query params
    const { searchParams } = new URL(req.url);
    const promotionId = searchParams.get('promotionId');

    if (!promotionId) {
      return NextResponse.json(
        { error: 'Promotion ID is required' },
        { status: 400 }
      );
    }

    // Get the application status
    const { data: application, error } = await supabase
      .from('promotion_applications')
      .select('*')
      .eq('promotion_id', promotionId)
      .eq('applicant_id', user.id)
      .single();

    if (error) throw error;

    return NextResponse.json({ application });
  } catch (error) {
    console.error('Error fetching application status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch application status' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

// PUT: Update application status (for promotion owners)
export async function PUT(req) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw new Error('Unauthorized');

    // Get the application ID and new status from the request
    const { applicationId, status } = await req.json();

    // Verify the user owns the promotion
    const { data: application, error: applicationError } = await supabase
      .from('promotion_applications')
      .select('*')
      .eq('id', applicationId)
      .eq('promotion_owner_id', user.id)
      .single();

    if (applicationError || !application) {
      return NextResponse.json(
        { error: 'Application not found or you do not have permission to update it' },
        { status: 404 }
      );
    }

    // Update the application status
    const { data: updatedApplication, error } = await supabase
      .from('promotion_applications')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId)
      .select()
      .single();

    if (error) throw error;

    // Send notification to applicant (implement this in a real app)
    // await notifyApplicant(application.applicant_id, {
    //   type: 'application_status_updated',
    //   status,
    //   promotionName: application.promotion_newsletter_name
    // });

    return NextResponse.json({ application: updatedApplication });
  } catch (error) {
    console.error('Error updating application status:', error);
    return NextResponse.json(
      { error: 'Failed to update application status' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
} 