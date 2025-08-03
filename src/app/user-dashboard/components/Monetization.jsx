"use client";
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  SponsoredAds,
  CrossPromotions,
  PaidSubscriptions,
  TipsAndDonations,
  DigitalProducts,
  AffiliateProgram
} from './monetization/index';
import { PlanGuard, UpgradePrompt, UsageWarning, PlanBadge } from './PlanGuard';

export default function Monetization({ user, onPushToNewsletter }) {
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(null);
  const [sponsoredAds, setSponsoredAds] = useState([]);
  const [crossPromotions, setCrossPromotions] = useState([]);
  const [subscriptionTiers, setSubscriptionTiers] = useState([]);
  const [donations, setDonations] = useState([]);
  const [donationTiers, setDonationTiers] = useState([]);
  const [digitalProducts, setDigitalProducts] = useState([]);
  const [affiliateReferrals, setAffiliateReferrals] = useState([]);
  const [affiliateLinks, setAffiliateLinks] = useState([]);
  const [stats, setStats] = useState({
    sponsoredAds: { averageEarnings: 0, activeSponsors: 0, platformFee: 20 },
    crossPromotions: { clicks: 0, totalRevenue: 0, platformFee: 20 },
    paidSubscriptions: { subscribers: 0, totalRevenue: 0, platformFee: 20 },
    tipsAndDonations: { supporters: 0, totalTips: 0, platformFee: 20 },
    digitalProducts: { productsSold: 0, totalSales: 0, platformFee: 20 },
    affiliateProgram: { referrals: 0, totalCommission: 0, platformFee: 20 },
  });

  // Fetch initial data
  useEffect(() => {
    fetchMonetizationData();
  }, []);

  const fetchMonetizationData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/monetization');
      if (!response.ok) throw new Error('Failed to fetch monetization data');
      
      const data = await response.json();
      
      // Set arrays with fallbacks
      setSponsoredAds(data.sponsored_ads || []);
      setCrossPromotions(data.cross_promotions || []);
      setSubscriptionTiers(data.subscription_tiers || []);
      setDonations(data.donations || []);
      setDonationTiers(data.donation_tiers || []);
      setDigitalProducts(data.digital_products || []);
      setAffiliateReferrals(data.affiliate_referrals || []);
      setAffiliateLinks(data.affiliate_links || []);
      
      // Transform API response to match frontend expectations
      const transformedStats = {
        sponsoredAds: {
          averageEarnings: data.stats?.sponsored_ads?.average_earnings || 0,
          activeSponsors: data.stats?.sponsored_ads?.active_sponsors || 0,
          platformFee: data.stats?.sponsored_ads?.platform_fee || 20
        },
        crossPromotions: {
          clicks: data.stats?.cross_promotions?.clicks || 0,
          totalRevenue: data.stats?.cross_promotions?.total_revenue || 0,
          platformFee: data.stats?.cross_promotions?.platform_fee || 20
        },
        paidSubscriptions: {
          subscribers: data.stats?.paid_subscriptions?.subscribers || 0,
          totalRevenue: data.stats?.paid_subscriptions?.total_revenue || 0,
          platformFee: data.stats?.paid_subscriptions?.platform_fee || 20
        },
        tipsAndDonations: {
          supporters: data.stats?.tips_and_donations?.supporters || 0,
          totalTips: data.stats?.tips_and_donations?.total_tips || 0,
          platformFee: data.stats?.tips_and_donations?.platform_fee || 20
        },
        digitalProducts: {
          productsSold: data.stats?.digital_products?.products_sold || 0,
          totalSales: data.stats?.digital_products?.total_sales || 0,
          platformFee: data.stats?.digital_products?.platform_fee || 20
        },
        affiliateProgram: {
          referrals: data.stats?.affiliate_program?.referrals || 0,
          totalCommission: data.stats?.affiliate_program?.total_commission || 0,
          platformFee: data.stats?.affiliate_program?.platform_fee || 20
        }
      };
      
      setStats(transformedStats);
    } catch (error) {
      toast.error('Failed to load monetization data');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePushToNewsletter = (adContent) => {
    if (onPushToNewsletter) {
      onPushToNewsletter(adContent);
      // Switch back to main view to allow user to go to newsletter
      setActiveSection(null);
      toast.success('Ad content ready! Click "Go to Newsletter" to add it to your draft.');
    }
  };

  const MonetizationCard = ({ 
    icon, 
    title, 
    description, 
    stats, 
    color = "cyan",
    showArrow = true,
    onClick
  }) => (
    <div 
      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <i className={`fas ${icon} text-${color}-500 text-2xl mr-3`}></i>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        {showArrow && (
          <i className={`fas fa-chevron-right text-${color}-500`}></i>
        )}
      </div>
      <p className="text-gray-600 mb-6">{description}</p>
      <div className="space-y-2">
        {stats.map((stat, index) => (
          <div key={index} className="flex items-center">
            <i className={`fas ${stat.icon} text-${stat.color}-500 mr-2`}></i>
            <span className="text-sm text-gray-600">{stat.text}</span>
          </div>
        ))}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Monetization</h2>
        {onPushToNewsletter && activeSection === null && (
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-sm text-blue-700">
              💡 Accept sponsored ads and push them directly to your newsletter creation!
            </p>
          </div>
        )}
      </div>
      
      {activeSection === 'sponsored-ads' ? (
        <SponsoredAds 
          sponsoredAds={sponsoredAds} 
          onClose={() => setActiveSection(null)} 
          onPushToNewsletter={handlePushToNewsletter}
        />
      ) : activeSection === 'cross-promotions' ? (
        <CrossPromotions 
          crossPromotions={crossPromotions} 
          onClose={() => setActiveSection(null)} 
        />
      ) : activeSection === 'paid-subscriptions' ? (
        <PaidSubscriptions 
          subscriptionTiers={subscriptionTiers} 
          onClose={() => setActiveSection(null)} 
        />
      ) : activeSection === 'tips-donations' ? (
        <TipsAndDonations 
          user={user}
          donations={donations}
          donationTiers={donationTiers}
          onClose={() => setActiveSection(null)} 
        />
      ) : activeSection === 'digital-products' ? (
        <DigitalProducts 
          digitalProducts={digitalProducts} 
          onClose={() => setActiveSection(null)} 
        />
      ) : activeSection === 'affiliate-program' ? (
        <AffiliateProgram 
          affiliateReferrals={affiliateReferrals}
          affiliateLinks={affiliateLinks}
          onClose={() => setActiveSection(null)} 
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sponsored Ads */}
          <MonetizationCard
            icon="fa-ad"
            title="Sponsored Ads"
            description="Partner with brands and monetize your newsletter through sponsored ads. You earn 80% of all sponsored ad revenue."
            stats={[
              {
                icon: "fa-chart-line",
                color: "green",
                text: `Average earnings: $${(stats.sponsoredAds?.averageEarnings || 0).toFixed(2)} (your share: $${((stats.sponsoredAds?.averageEarnings || 0) * 0.8).toFixed(2)})`
              },
              {
                icon: "fa-handshake",
                color: "green",
                text: `${stats.sponsoredAds?.activeSponsors || 0} active sponsors`
              },
              {
                icon: "fa-info-circle",
                color: "cyan",
                text: `Platform fee: ${stats.sponsoredAds?.platformFee || 20}%`
              }
            ]}
            onClick={() => setActiveSection('sponsored-ads')}
          />

          {/* Cross-Promotions */}
          <MonetizationCard
            icon="fa-bolt"
            title="Cross-Promotions"
            description="Promote other newsletters in your subscription flow and earn 80% of the revenue."
            color="red"
            stats={[
              {
                icon: "fa-mouse-pointer",
                color: "green",
                text: `${crossPromotions.reduce((sum, promo) => sum + (promo.clicks || 0), 0)} clicks generated`
              },
              {
                icon: "fa-dollar-sign",
                color: "green",
                text: `Total revenue: $${crossPromotions.reduce((sum, promo) => sum + (promo.revenue || 0), 0).toFixed(2)} (your share: $${(crossPromotions.reduce((sum, promo) => sum + (promo.revenue || 0), 0) * 0.8).toFixed(2)})`
              },
              {
                icon: "fa-info-circle",
                color: "cyan",
                text: `Platform fee: ${stats.crossPromotions?.platformFee || 20}%`
              }
            ]}
            onClick={() => setActiveSection('cross-promotions')}
          />

          {/* Paid Subscriptions */}
          <MonetizationCard
            icon="fa-credit-card"
            title="Paid Subscriptions"
            description="Offer premium content through paid subscriptions and earn 80% of subscription revenue."
            color="yellow"
            stats={[
              {
                icon: "fa-users",
                color: "green",
                text: `${subscriptionTiers.reduce((sum, tier) => sum + (tier.subscribers || 0), 0)} subscribers`
              },
              {
                icon: "fa-dollar-sign",
                color: "green",
                text: `Total revenue: $${subscriptionTiers.reduce((sum, tier) => sum + (tier.revenue || 0), 0).toFixed(2)} (your share: $${(subscriptionTiers.reduce((sum, tier) => sum + (tier.revenue || 0), 0) * 0.8).toFixed(2)})`
              },
              {
                icon: "fa-info-circle",
                color: "cyan",
                text: `Platform fee: ${stats.paidSubscriptions?.platformFee || 20}%`
              }
            ]}
            onClick={() => setActiveSection('paid-subscriptions')}
          />

          {/* Tips & Donations Card */}
          <MonetizationCard
            icon="fa-gift"
            title="Tips & Donations"
            description="Accept tips and donations from your supportive readers."
            color="pink"
            stats={[
              {
                icon: "fa-heart",
                color: "green",
                text: `${new Set(donations.map(d => d.supporter)).size} supporters`
              },
              {
                icon: "fa-dollar-sign",
                color: "green",
                text: `Total tips: $${donations.reduce((sum, d) => sum + (d.amount || 0), 0).toFixed(2)} (your share: $${(donations.reduce((sum, d) => sum + (d.amount || 0), 0) * 0.8).toFixed(2)})`
              },
              {
                icon: "fa-info-circle",
                color: "cyan",
                text: `Platform fee: ${stats.tipsAndDonations?.platformFee || 20}%`
              }
            ]}
            onClick={() => setActiveSection('tips-donations')}
          />

          {/* Digital Products Card */}
          <MonetizationCard
            icon="fa-shopping-cart"
            title="Digital Products"
            description="Sell courses, ebooks, and other digital products and earn sales revenue."
            color="purple"
            stats={[
              {
                icon: "fa-box",
                color: "green",
                text: `${digitalProducts.reduce((sum, product) => sum + (product.sales || 0), 0)} products sold`
              },
              {
                icon: "fa-dollar-sign",
                color: "green",
                text: `Total sales: $${digitalProducts.reduce((sum, product) => sum + (product.revenue || 0), 0).toFixed(2)} (your share: $${(digitalProducts.reduce((sum, product) => sum + (product.revenue || 0), 0) * 0.8).toFixed(2)})`
              },
              {
                icon: "fa-info-circle",
                color: "cyan",
                text: `Platform fee: ${stats.digitalProducts?.platformFee || 20}%`
              }
            ]}
            onClick={() => setActiveSection('digital-products')}
          />

          {/* Affiliate Program Card */}
          <MonetizationCard
            icon="fa-share-alt"
            title="Affiliate Program"
            description="Earn 20% recurring commission on referred platform subscriptions. Commission continues monthly until subscriber cancels."
            color="green"
            stats={[
              {
                icon: "fa-user-plus",
                color: "green",
                text: `${affiliateReferrals.length} referrals`
              },
              {
                icon: "fa-dollar-sign",
                color: "green",
                text: `Total commission: $${affiliateReferrals.reduce((sum, ref) => sum + (ref.commission || 0), 0).toFixed(2)}`
              },
              {
                icon: "fa-info-circle",
                color: "cyan",
                text: `Platform fee: ${stats.affiliateProgram?.platformFee || 20}%`
              }
            ]}
            onClick={() => setActiveSection('affiliate-program')}
          />
        </div>
      )}
    </div>
  );
}