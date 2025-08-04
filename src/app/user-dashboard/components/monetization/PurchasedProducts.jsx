'use client';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useSession } from '@/lib/auth-client';

export default function PurchasedProducts() {
  const [purchases, setPurchases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useSession();

  useEffect(() => {
    if (user) {
      fetchPurchases();
    }
  }, [user]);

  const fetchPurchases = async () => {
    try {
      const response = await fetch('/api/user/purchases/digital-products');
      if (!response.ok) throw new Error('Failed to fetch purchases');
      
      const data = await response.json();
      setPurchases(data.purchases || []);
    } catch (error) {
      console.error('Error fetching purchases:', error);
      toast.error('Failed to load your purchases');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (purchase) => {
    try {
      // Get secure download link
      const response = await fetch(`/api/user/purchases/digital-products/${purchase.id}/download`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to get download link');

      const data = await response.json();
      
      if (data.download_url) {
        // Create temporary download link
        const link = document.createElement('a');
        link.href = data.download_url;
        link.download = data.filename || purchase.product_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success('Download started');
      } else {
        throw new Error('No download URL provided');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download product');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const getProductIcon = (type) => {
    switch (type) {
      case 'course':
        return 'fas fa-graduation-cap';
      case 'ebook':
        return 'fas fa-book';
      case 'template':
        return 'fas fa-file-alt';
      case 'resource':
        return 'fas fa-download';
      default:
        return 'fas fa-box';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
        <span className="ml-2 text-gray-600">Loading your purchases...</span>
      </div>
    );
  }

  if (purchases.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-shopping-bag text-2xl text-gray-400"></i>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No purchases yet</h3>
        <p className="text-gray-500 mb-4">
          You haven't purchased any digital products yet.
        </p>
        <a
          href="/marketplace"
          className="inline-flex items-center px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
        >
          <i className="fas fa-store mr-2"></i>
          Browse Marketplace
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My Purchases</h2>
          <p className="text-gray-600">Digital products you've purchased</p>
        </div>
        <div className="text-sm text-gray-500">
          {purchases.length} product{purchases.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {purchases.map((purchase) => (
          <div key={purchase.id} className="bg-white rounded-lg shadow-md p-6">
            {/* Product Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center mr-3">
                  <i className={`${getProductIcon(purchase.product_type)} text-cyan-600`}></i>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {purchase.product_name}
                  </h3>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {purchase.product_type}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">
                  {formatPrice(purchase.purchase_price)}
                </div>
                <div className="text-xs text-gray-500">
                  {formatDate(purchase.completed_at || purchase.created_at)}
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="mb-4">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                purchase.status === 'completed' 
                  ? 'bg-green-100 text-green-800'
                  : purchase.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                <i className={`mr-1 ${
                  purchase.status === 'completed' 
                    ? 'fas fa-check' 
                    : purchase.status === 'pending'
                    ? 'fas fa-clock'
                    : 'fas fa-times'
                }`}></i>
                {purchase.status}
              </span>
            </div>

            {/* Download Button */}
            {purchase.status === 'completed' && (
              <div className="space-y-2">
                <button
                  onClick={() => handleDownload(purchase)}
                  className="w-full bg-cyan-500 hover:bg-cyan-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  <i className="fas fa-download mr-2"></i>
                  Download
                </button>
                
                {purchase.access_expires_at && (
                  <p className="text-xs text-gray-500 text-center">
                    Access expires: {formatDate(purchase.access_expires_at)}
                  </p>
                )}
              </div>
            )}

            {/* Pending/Failed States */}
            {purchase.status === 'pending' && (
              <div className="text-center py-2">
                <p className="text-sm text-yellow-600">
                  <i className="fas fa-clock mr-1"></i>
                  Payment processing...
                </p>
              </div>
            )}

            {purchase.status === 'failed' && (
              <div className="text-center py-2">
                <p className="text-sm text-red-600 mb-2">
                  <i className="fas fa-exclamation-triangle mr-1"></i>
                  Purchase failed
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="text-xs text-cyan-600 hover:text-cyan-800"
                >
                  Refresh status
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Support Notice */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <i className="fas fa-info-circle text-blue-400 text-lg"></i>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 mb-1">
              Need help with your purchase?
            </h3>
            <p className="text-sm text-blue-700">
              Contact the creator directly or reach out to our support team if you have any issues with your digital products.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}