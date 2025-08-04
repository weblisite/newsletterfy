"use client";
import React, { useState, useEffect } from "react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from "next/navigation";

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [userStats, setUserStats] = useState({
    newsletter_count: 0,
    total_subscribers: 0,
    total_donations: 0,
    total_supporters: 0,
    active_subscriptions: 0
  });
  const [currentPlan, setCurrentPlan] = useState(null);
  const [platformPlans, setPlatformPlans] = useState([]);
  const [currentPlatformPlan, setCurrentPlatformPlan] = useState('Free');
  const [planTiers, setPlanTiers] = useState({});
  const [billingHistory, setBillingHistory] = useState([]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedTier, setSelectedTier] = useState(null);
  const [selectedPlanTiers, setSelectedPlanTiers] = useState({}); // Track selected tier for each plan
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [currentUsage, setCurrentUsage] = useState({
    subscribers: 0,
    emailsSent: 0,
    newsletters: 0
  });
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    email: '',
    profile_picture_url: ''
  });

  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      // Get current user from auth
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Auth error:', authError);
        return;
      }

      if (!authUser) {
        router.push('/auth/login');
        return;
      }

      setUser(authUser);
      
      // Get additional user data from users table with stats
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (userData) {
        setFormData({
          full_name: userData.full_name || userData.name || authUser.user_metadata?.full_name || '',
          username: userData.username || authUser.user_metadata?.username || '',
          email: authUser.email || '',
          profile_picture_url: userData.profile_picture_url || ''
        });
      } else {
        // Use auth user metadata if no users table entry
        setFormData({
          full_name: authUser.user_metadata?.full_name || '',
          username: authUser.user_metadata?.username || '',
          email: authUser.email || '',
          profile_picture_url: ''
        });
      }

      // Fetch user statistics
      await fetchUserStats(authUser.id);
      
      // Fetch current subscription plan
      await fetchCurrentPlan(authUser.id);
      
      // Fetch platform plans and billing data
      await fetchPlatformPlans();
      await fetchBillingData(authUser.id);
      
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchUserStats = async (userId) => {
    try {
      const { data, error } = await supabase.rpc('get_user_stats', { user_id: userId });
      
      if (error) {
        // Fallback to manual queries if RPC doesn't exist
        const [newslettersResult, subscriptionsResult, userDataResult] = await Promise.all([
          supabase.from('newsletters').select('id, subscriber_count').eq('user_id', userId),
          supabase.from('subscriptions').select('id').eq('creator_id', userId).eq('status', 'active'),
          supabase.from('users').select('total_donations, total_supporters').eq('id', userId).single()
        ]);

        const newsletterCount = newslettersResult.data?.length || 0;
        const totalSubscribers = newslettersResult.data?.reduce((sum, n) => sum + (n.subscriber_count || 0), 0) || 0;
        const activeSubscriptions = subscriptionsResult.data?.length || 0;
        
        setUserStats({
          newsletter_count: newsletterCount,
          total_subscribers: totalSubscribers,
          total_donations: parseFloat(userDataResult.data?.total_donations || 0),
          total_supporters: userDataResult.data?.total_supporters || 0,
          active_subscriptions: activeSubscriptions
        });
      } else {
        setUserStats(data[0] || {
          newsletter_count: 0,
          total_subscribers: 0,
          total_donations: 0,
          total_supporters: 0,
          active_subscriptions: 0
        });
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const fetchCurrentPlan = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          subscription_plans:tier_id (
            name,
            amount,
            interval,
            features
          )
        `)
        .eq('subscriber_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        setCurrentPlan(data[0]);
      }
    } catch (error) {
      console.error('Error fetching current plan:', error);
    }
  };

  const fetchPlatformPlans = async () => {
    try {
      const response = await fetch('/api/platform-plans');
      if (!response.ok) throw new Error('Failed to fetch platform plans');
      
      const data = await response.json();
      setPlatformPlans(data.plans || []);
      setPlanTiers(data.tiers || {});
    } catch (error) {
      console.error('Error fetching platform plans:', error);
    }
  };

  const fetchBillingData = async (userId) => {
    try {
      // Fetch user's current platform plan from profiles or users table
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (profile) {
        setCurrentPlatformPlan(profile.plan_type || 'Free');
        setCurrentUsage({
          subscribers: userStats.total_subscribers,
          emailsSent: 0, // This would come from email tracking
          newsletters: userStats.newsletter_count
        });
      }

      // Fetch billing history from subscriptions
      const { data: payments } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('subscriber_id', userId)
        .order('created_at', { ascending: false });

      setBillingHistory(payments || []);
    } catch (error) {
      console.error('Error fetching billing data:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      showMessage('Please select an image file.', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      showMessage('Image size must be less than 5MB.', 'error');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `profile-pictures/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);

      // Update form data
      setFormData(prev => ({
        ...prev,
        profile_picture_url: publicUrl
      }));

      showMessage('Profile picture uploaded successfully!', 'success');
    } catch (error) {
      console.error('Error uploading image:', error);
      showMessage('Failed to upload image. Please try again.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleUpgrade = async (plan, tier) => {
    try {
      setShowUpgradeModal(false);
      
      // Get phone number for M-Pesa payments
      let phoneNumber = '';
      if (paymentMethod === 'mpesa') {
        phoneNumber = prompt('Please enter your M-Pesa phone number (e.g., 254700000000):');
        if (!phoneNumber) {
          showMessage('Phone number is required for M-Pesa payments', 'error');
          return;
        }
      }

      const response = await fetch('/api/payments/polar-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_type: plan,
          subscriber_tier: tier.subscriber_limit,
          customer_email: formData.email || user.email,
          customer_name: formData.full_name || user.user_metadata?.full_name || 'User',
          success_url: `${window.location.origin}/user-dashboard?upgrade=success&plan=${plan}`,
          cancel_url: `${window.location.origin}/user-dashboard`,
          metadata: {
            source: 'user_profile',
            user_id: user.id,
            payment_method: paymentMethod,
            phone_number: phoneNumber
          }
        }),
      });

      const data = await response.json();

      if (data.success && data.checkout_url) {
        // Redirect to Polar.sh checkout (handles all payment methods)
        showMessage('Redirecting to secure checkout...', 'success');
        window.location.href = data.checkout_url;
      } else {
        showMessage(data.error || 'Failed to create checkout session', 'error');
      }
    } catch (error) {
      console.error('Error processing upgrade:', error);
      showMessage('Failed to process upgrade. Please try again.', 'error');
    }
  };

  const showMessage = (text, type = 'success') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Update auth user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: formData.full_name,
          username: formData.username
        }
      });

      if (authError) {
        throw authError;
      }

      // Update or insert in users table
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: formData.email,
          full_name: formData.full_name,
          name: formData.full_name, // Also set name field for compatibility
          username: formData.username,
          profile_picture_url: formData.profile_picture_url,
          updated_at: new Date().toISOString()
        });

      if (userError) {
        throw userError;
      }

      showMessage('Profile updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating profile:', error);
      showMessage('Failed to update profile. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      router.push('/');
    } catch (error) {
      console.error('Error logging out:', error);
      showMessage('Failed to log out. Please try again.', 'error');
    }
  };



  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Account Settings</h2>
          <p className="text-gray-600 mt-1">Manage your account information and preferences</p>
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div className={`p-4 rounded-lg ${
          messageType === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-center">
            {messageType === 'success' ? (
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
            {message}
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-blue-50 p-3 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Newsletters</p>
              <p className="text-2xl font-bold text-gray-900">{userStats.newsletter_count}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-green-50 p-3 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Subscribers</p>
              <p className="text-2xl font-bold text-gray-900">{userStats.total_subscribers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-yellow-50 p-3 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Donations</p>
              <p className="text-2xl font-bold text-gray-900">${userStats.total_donations.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-purple-50 p-3 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Supporters</p>
              <p className="text-2xl font-bold text-gray-900">{userStats.total_supporters}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Current Subscription Plan */}
      {currentPlan && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Current Subscription Plan</h3>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-medium text-gray-900">{currentPlan.subscription_plans?.name}</h4>
              <p className="text-gray-600">${currentPlan.subscription_plans?.amount}/{currentPlan.subscription_plans?.interval}</p>
              <p className="text-sm text-gray-500 mt-1">
                Next billing: {currentPlan.next_billing_date ? new Date(currentPlan.next_billing_date).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div className="text-right">
              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                currentPlan.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {currentPlan.status}
              </span>
            </div>
          </div>
          {currentPlan.subscription_plans?.features && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Plan Features:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                {currentPlan.subscription_plans.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Platform Subscription & Billing */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Platform Subscription & Billing</h3>
        
        {/* Current Platform Plan */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-lg font-bold text-cyan-600">{currentPlatformPlan}</h4>
              <p className="text-gray-600">
                {platformPlans.find(p => p.name === currentPlatformPlan)?.price > 0 
                  ? `$${platformPlans.find(p => p.name === currentPlatformPlan)?.price}/month`
                  : 'Free Plan'
                }
              </p>
            </div>
            {currentPlatformPlan !== 'Enterprise' && (
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="bg-cyan-500 text-white px-4 py-2 rounded-lg hover:bg-cyan-600 transition-colors"
              >
                Upgrade Plan
              </button>
            )}
          </div>

          {/* Usage Stats */}
          <div className="space-y-4">
            {platformPlans.find(p => p.name === currentPlatformPlan) && (
              <>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Subscribers</span>
                    <span>
                      {(currentUsage?.subscribers || 0).toLocaleString()} / {
                        platformPlans.find(p => p.name === currentPlatformPlan)?.max_subscribers === -1 
                          ? '∞' 
                          : (platformPlans.find(p => p.name === currentPlatformPlan)?.max_subscribers || 0).toLocaleString()
                      }
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-cyan-500 h-2 rounded-full"
                      style={{ 
                        width: platformPlans.find(p => p.name === currentPlatformPlan)?.max_subscribers === -1 
                          ? '20%' 
                          : `${Math.min((currentUsage.subscribers / platformPlans.find(p => p.name === currentPlatformPlan)?.max_subscribers) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Newsletters</span>
                    <span>
                      {currentUsage.newsletters} / {
                        platformPlans.find(p => p.name === currentPlatformPlan)?.max_newsletters === -1 
                          ? '∞' 
                          : platformPlans.find(p => p.name === currentPlatformPlan)?.max_newsletters
                      }
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ 
                        width: platformPlans.find(p => p.name === currentPlatformPlan)?.max_newsletters === -1 
                          ? '15%' 
                          : `${Math.min((currentUsage.newsletters / platformPlans.find(p => p.name === currentPlatformPlan)?.max_newsletters) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Available Plans */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Available Plans</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {platformPlans.map((plan) => {
              const hasTiers = planTiers[plan.name] && planTiers[plan.name].length > 0;
              const isEnterprise = plan.name === 'Enterprise';
              
              return (
                <div 
                  key={plan.id} 
                  className={`rounded-lg border-2 p-4 ${
                    currentPlatformPlan === plan.name
                      ? 'border-cyan-500 bg-cyan-50' 
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  } transition-all duration-200`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-bold text-gray-900">{plan.name}</h5>
                    {currentPlatformPlan === plan.name && (
                      <span className="bg-cyan-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                        Current
                      </span>
                    )}
                  </div>
                  
                  {/* Pricing Section */}
                  {isEnterprise ? (
                    <div className="mb-4">
                      <div className="text-lg font-bold text-gray-900 mb-1">Custom Pricing</div>
                      <div className="text-sm text-gray-600">Contact our sales team</div>
                    </div>
                  ) : hasTiers ? (
                    <div className="mb-4">
                      <select 
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white"
                        onChange={(e) => {
                          const selectedTierData = planTiers[plan.name].find(t => t.id === e.target.value);
                          if (selectedTierData) {
                            // Update the selected tier for this specific plan
                            setSelectedPlanTiers(prev => ({
                              ...prev,
                              [plan.name]: selectedTierData
                            }));
                            setSelectedPlan(plan.name);
                            setSelectedTier(selectedTierData);
                          }
                        }}
                        value={selectedPlanTiers[plan.name]?.id || ""}
                      >
                        <option value="" disabled>Select subscriber tier</option>
                        {planTiers[plan.name].map((tier) => (
                          <option key={tier.id} value={tier.id}>
                            {(tier?.subscriber_limit || 0).toLocaleString()} subscribers - ${tier?.price || 0}/month
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="mb-4">
                      <span className="text-2xl font-bold text-gray-900">${plan.price}</span>
                      <span className="text-gray-600">/month</span>
                    </div>
                  )}

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center">
                      <i className="fas fa-users text-cyan-500 w-4 mr-2"></i>
                      <span>
                        {selectedPlanTiers[plan.name] 
                          ? `${(selectedPlanTiers[plan.name]?.subscriber_limit || 0).toLocaleString()} subscribers`
                          : plan.max_subscribers === -1 
                            ? 'Unlimited subscribers' 
                            : `${(plan?.max_subscribers || 0).toLocaleString()} subscribers`
                        }
                      </span>
                    </div>
                    <div className="flex items-center">
                      <i className="fas fa-newspaper text-cyan-500 w-4 mr-2"></i>
                      <span>{plan.max_newsletters === -1 ? 'Unlimited' : plan.max_newsletters} newsletters</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {currentPlatformPlan !== plan.name && (
                    <>
                      {isEnterprise ? (
                        <a
                          href="https://calendly.com/newsletterfy/meeting"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full bg-cyan-500 text-white py-2 px-3 rounded-lg hover:bg-cyan-600 transition-colors text-sm text-center block"
                        >
                          Contact Sales
                        </a>
                      ) : hasTiers ? (
                        <button
                          onClick={() => {
                            if (selectedPlanTiers[plan.name]) {
                              setSelectedPlan(plan.name);
                              setSelectedTier(selectedPlanTiers[plan.name]);
                              setShowUpgradeModal(true);
                            } else {
                              showMessage('Please select a pricing tier first', 'error');
                            }
                          }}
                          className="w-full bg-cyan-500 text-white py-2 px-3 rounded-lg hover:bg-cyan-600 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={!selectedPlanTiers[plan.name]}
                        >
                          {selectedPlanTiers[plan.name] ? 
                            `Upgrade to ${plan.name} ($${selectedPlanTiers[plan.name].price}/mo)` : 
                            `Choose ${plan.name}`
                          }
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedPlan(plan.name);
                            setSelectedTier({
                              subscriber_limit: plan.max_subscribers,
                              price: plan.price
                            });
                            setShowUpgradeModal(true);
                          }}
                          className="w-full bg-cyan-500 text-white py-2 px-3 rounded-lg hover:bg-cyan-600 transition-colors text-sm"
                        >
                          Upgrade to {plan.name}
                        </button>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Billing History */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Billing History</h4>
          {billingHistory.length === 0 ? (
            <div className="text-center py-8">
              <i className="fas fa-receipt text-4xl text-gray-300 mb-4"></i>
              <h5 className="text-lg font-medium text-gray-900 mb-2">No billing history</h5>
              <p className="text-gray-600">Your billing history will appear here once you upgrade to a paid plan.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {billingHistory.slice(0, 5).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h6 className="font-medium">{payment.plan_type || 'Platform Subscription'}</h6>
                    <p className="text-sm text-gray-600">
                      {new Date(payment.created_at).toLocaleDateString()} • {payment.payment_method}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${payment.amount}</div>
                    <div className={`text-sm ${
                      payment.status === 'active' 
                        ? 'text-green-600' 
                        : payment.status === 'pending'
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}>
                      {payment.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Profile Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Personal Information</h3>
        
        <form onSubmit={handleSave} className="space-y-6">
          {/* Profile Picture */}
          <div className="flex items-center space-x-6">
            <div className="shrink-0">
              {formData.profile_picture_url ? (
                <img
                  className="h-24 w-24 rounded-full object-cover border-4 border-gray-200"
                  src={formData.profile_picture_url}
                  alt="Profile"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-200">
                  <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-grow">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Picture
              </label>
              <div className="flex items-center space-x-4">
                <label className="cursor-pointer bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500">
                  {uploading ? 'Uploading...' : 'Choose File'}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </label>
                {formData.profile_picture_url && (
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, profile_picture_url: '' }))}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Remove
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                placeholder="Enter your full name"
              />
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                placeholder="Enter your username"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              placeholder="Enter your email"
              disabled
            />
            <p className="text-sm text-gray-500 mt-1">
              Email changes require verification and are not currently supported.
            </p>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-400 text-white px-6 py-2 rounded-lg transition-colors duration-200 flex items-center"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Account Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Account Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Account ID</label>
            <div className="bg-gray-50 px-3 py-2 rounded-lg text-gray-600 font-mono text-sm">
              {user?.id}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Member Since</label>
            <div className="bg-gray-50 px-3 py-2 rounded-lg text-gray-600">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
        <h3 className="text-xl font-semibold text-red-900 mb-4">Danger Zone</h3>
        <p className="text-gray-600 mb-4">
          Once you logout, you'll need to sign in again to access your dashboard.
        </p>
        
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout from Account
        </button>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Upgrade to {selectedPlan}</h3>
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              {/* Tier Selection - Only show if no tier was pre-selected */}
              {(selectedPlan === 'Pro' || selectedPlan === 'Business') && planTiers[selectedPlan] && !selectedTier && (
                <div className="mb-6">
                  <h4 className="font-medium mb-3">Select subscriber tier:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {planTiers[selectedPlan].map((tier, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedTier(tier)}
                        className={`p-3 border rounded-lg text-left transition-colors ${
                          selectedTier?.subscriber_limit === tier.subscriber_limit
                            ? 'border-cyan-500 bg-cyan-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-medium">{(tier?.subscriber_limit || 0).toLocaleString()} subscribers</div>
                        <div className="text-cyan-600 font-bold">${tier.price}/month</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected Tier Display */}
              {selectedTier && (
                <div className="mb-6">
                  <h4 className="font-medium mb-3">Selected Plan:</h4>
                  <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-bold text-lg">{selectedPlan}</div>
                        <div className="text-gray-600">{(selectedTier?.subscriber_limit || 0).toLocaleString()} subscribers</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-cyan-600">${selectedTier.price}</div>
                        <div className="text-sm text-gray-600">/month</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedTier(null)}
                      className="mt-2 text-sm text-cyan-600 hover:text-cyan-800"
                    >
                      Change selection
                    </button>
                  </div>
                </div>
              )}

              {/* Payment Method Selection */}
              <div className="mb-6">
                <h4 className="font-medium mb-3">Payment Method:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 border rounded-lg text-center transition-colors ${
                      paymentMethod === 'card'
                        ? 'border-cyan-500 bg-cyan-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <i className="fas fa-credit-card text-2xl mb-2"></i>
                    <div className="font-medium">Credit/Debit Card</div>
                    <div className="text-sm text-gray-600">Visa, Mastercard</div>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('mpesa')}
                    className={`p-3 border rounded-lg text-center transition-colors ${
                      paymentMethod === 'mpesa'
                        ? 'border-cyan-500 bg-cyan-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <i className="fas fa-mobile-alt text-2xl mb-2"></i>
                    <div className="font-medium">M-Pesa</div>
                    <div className="text-sm text-gray-600">Mobile Money</div>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('bank')}
                    className={`p-3 border rounded-lg text-center transition-colors ${
                      paymentMethod === 'bank'
                        ? 'border-cyan-500 bg-cyan-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <i className="fas fa-university text-2xl mb-2"></i>
                    <div className="font-medium">Bank Transfer</div>
                    <div className="text-sm text-gray-600">Direct Transfer</div>
                  </button>
                </div>
              </div>

              {/* Upgrade Summary */}
              {selectedTier && (
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h4 className="font-medium mb-2">Upgrade Summary:</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Plan:</span>
                      <span className="font-medium">{selectedPlan}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Subscribers:</span>
                      <span className="font-medium">{(selectedTier?.subscriber_limit || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Monthly Cost:</span>
                      <span className="font-medium">${selectedTier.price}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Payment Method:</span>
                      <span className="font-medium">
                        {paymentMethod === 'card' && '💳 Card'}
                        {paymentMethod === 'mpesa' && '📱 M-Pesa'}
                        {paymentMethod === 'bank' && '🏦 Bank Transfer'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const tier = selectedTier || { 
                      subscriber_limit: platformPlans.find(p => p.name === selectedPlan)?.max_subscribers, 
                      price: platformPlans.find(p => p.name === selectedPlan)?.price 
                    };
                    handleUpgrade(selectedPlan, tier);
                  }}
                  disabled={!selectedTier && (selectedPlan === 'Pro' || selectedPlan === 'Business')}
                  className="flex-1 bg-cyan-500 text-white py-2 px-4 rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Proceed to Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 