import { NextResponse } from 'next/server';
import emailProviderManager from '@/lib/email-provider-manager';

/**
 * Test email provider
 * Sends a test email using the specified provider
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { provider, testEmail } = body;

    // Validate inputs
    if (!provider || !['sendgrid', 'elasticemail'].includes(provider)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid provider. Must be "sendgrid" or "elasticemail"' 
        },
        { status: 400 }
      );
    }

    if (!testEmail) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Test email address is required' 
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmail)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid email address format' 
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

    // Test the specified provider
    const result = await emailProviderManager.testProvider(provider, testEmail);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        provider: provider,
        messageId: result.messageId,
        responseTime: result.responseTime,
        message: result.message,
        testEmail: testEmail
      });
    } else {
      return NextResponse.json(
        { 
          success: false,
          provider: provider,
          error: result.error,
          message: result.message,
          testEmail: testEmail
        },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Error testing email provider:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to test email provider',
        details: error.message 
      },
      { status: 500 }
    );
  }
}