import { NextResponse } from 'next/server';
import emailProviderManager from '@/lib/email-provider-manager';

/**
 * Get email provider status
 * Returns the current active provider and status of all providers
 */
export async function GET() {
  try {
    // Initialize manager if not already done
    if (!emailProviderManager.isInitialized) {
      await emailProviderManager.initialize();
    }

    // Get comprehensive provider status
    const status = await emailProviderManager.getProvidersStatus();
    
    return NextResponse.json(status);
    
  } catch (error) {
    console.error('Error getting email provider status:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get email provider status',
        details: error.message 
      },
      { status: 500 }
    );
  }
}