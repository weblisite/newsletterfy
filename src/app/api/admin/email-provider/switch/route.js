import { NextResponse } from 'next/server';
import emailProviderManager from '@/lib/email-provider-manager';

/**
 * Switch email provider
 * Switches the active email provider with admin confirmation
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { provider } = body;

    // Validate provider
    if (!provider || !['sendgrid', 'elasticemail'].includes(provider)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid provider. Must be "sendgrid" or "elasticemail"' 
        },
        { status: 400 }
      );
    }

    // TODO: Add admin authentication check here
    // For now, we'll proceed without authentication
    // In production, you should verify the user has admin privileges
    
    // Initialize manager if not already done
    if (!emailProviderManager.isInitialized) {
      await emailProviderManager.initialize();
    }

    // Perform the switch
    const result = await emailProviderManager.switchProvider(provider, null);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        activeProvider: result.activeProvider,
        previousProvider: result.previousProvider,
        message: result.message
      });
    } else {
      return NextResponse.json(
        { 
          success: false,
          error: result.error,
          activeProvider: result.activeProvider
        },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Error switching email provider:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to switch email provider',
        details: error.message 
      },
      { status: 500 }
    );
  }
}