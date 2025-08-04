'use client';
import React, { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import PurchasedProducts from '@/app/user-dashboard/components/monetization/PurchasedProducts';

export default function PurchasesPage() {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Handle success/error messages from URL params
    const purchase = searchParams.get('purchase');
    const product = searchParams.get('product');
    
    if (purchase === 'success') {
      toast.success(
        product 
          ? `Digital product purchased successfully! You can now download your files.`
          : 'Purchase completed successfully!'
      );
    } else if (purchase === 'cancelled') {
      toast.error('Purchase was cancelled.');
    }
  }, [searchParams]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PurchasedProducts />
    </div>
  );
}