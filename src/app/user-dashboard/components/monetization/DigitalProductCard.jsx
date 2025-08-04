'use client';
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useSession } from '@/lib/auth-client';

export default function DigitalProductCard({ product, onPurchase }) {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useSession();

  const handlePurchase = async () => {
    if (!user) {
      toast.error('Please sign in to purchase this product');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/monetization/digital-products/polar-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          customer_email: user.email,
          customer_name: user.full_name || user.email,
          user_id: user.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate purchase');
      }

      if (data.success && data.checkout_url) {
        toast.success('Redirecting to secure checkout...');
        window.location.href = data.checkout_url;
        if (onPurchase) onPurchase(product.id);
      } else {
        throw new Error('Invalid response from purchase API');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to process purchase');
      console.error('Digital product purchase error:', error);
    } finally {
      setIsLoading(false);
    }
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

  const getTypeColor = (type) => {
    switch (type) {
      case 'course':
        return 'bg-blue-100 text-blue-800';
      case 'ebook':
        return 'bg-green-100 text-green-800';
      case 'template':
        return 'bg-purple-100 text-purple-800';
      case 'resource':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-6">
      {/* Product Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mr-4">
            <i className={`${getProductIcon(product.type)} text-cyan-600 text-xl`}></i>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {product.name}
            </h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(product.type)}`}>
              {product.type}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">
            {formatPrice(product.price)}
          </div>
          {product.sales > 0 && (
            <div className="text-sm text-gray-500">
              {product.sales} sales
            </div>
          )}
        </div>
      </div>

      {/* Product Description */}
      <p className="text-gray-600 mb-4 line-clamp-3">
        {product.description}
      </p>

      {/* Product Features */}
      {product.features && product.features.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">What's included:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {product.features.slice(0, 3).map((feature, index) => (
              <li key={index} className="flex items-center">
                <i className="fas fa-check text-green-500 mr-2 text-xs"></i>
                {feature}
              </li>
            ))}
            {product.features.length > 3 && (
              <li className="text-gray-400">
                +{product.features.length - 3} more features
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Preview Link */}
      {product.preview_url && (
        <div className="mb-4">
          <a
            href={product.preview_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm text-cyan-600 hover:text-cyan-800"
          >
            <i className="fas fa-eye mr-1"></i>
            Preview
          </a>
        </div>
      )}

      {/* Purchase Button */}
      <button
        onClick={handlePurchase}
        disabled={isLoading || product.status !== 'published'}
        className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
          product.status !== 'published'
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : isLoading
            ? 'bg-cyan-400 text-white cursor-not-allowed'
            : 'bg-cyan-500 hover:bg-cyan-600 text-white'
        }`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Processing...
          </div>
        ) : product.status !== 'published' ? (
          'Not Available'
        ) : (
          <>
            <i className="fas fa-shopping-cart mr-2"></i>
            Purchase Now
          </>
        )}
      </button>

      {/* Secure Payment Notice */}
      <div className="mt-3 flex items-center justify-center text-xs text-gray-500">
        <i className="fas fa-shield-alt mr-1"></i>
        Secure payment powered by Polar.sh
      </div>
    </div>
  );
}