'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    acceptTerms: false
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Plan information from URL params or localStorage
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    // Get plan from URL params or localStorage
    const planFromUrl = searchParams.get('plan');
    const tierFromUrl = searchParams.get('tier');
    const priceFromUrl = searchParams.get('price');
    
    if (planFromUrl && tierFromUrl && priceFromUrl) {
      const plan = {
        type: planFromUrl,
        subscribers: parseInt(tierFromUrl),
        price: parseFloat(priceFromUrl)
      };
      setSelectedPlan(plan);
      // Save to localStorage as backup
      localStorage.setItem('selectedPlan', JSON.stringify(plan));
    } else {
      // Try to get from localStorage
      const savedPlan = localStorage.getItem('selectedPlan');
      if (savedPlan) {
        setSelectedPlan(JSON.parse(savedPlan));
      }
    }
  }, [searchParams]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      setError('Please fill in all required fields');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    if (!formData.acceptTerms) {
      setError('Please accept the terms and conditions');
      return false;
    }

    return true;
  };

  const handleOAuthSignup = async (provider) => {
    setError('');
    setLoading(true);

    try {
      // Build redirect URL with plan information
      let redirectTo = `${window.location.origin}/auth/callback`;
      
      if (selectedPlan) {
        // Add plan parameters to the callback URL
        const planParams = new URLSearchParams({
          plan: selectedPlan.type,
          tier: selectedPlan.subscribers.toString(),
          price: selectedPlan.price.toString()
        });
        redirectTo += `?${planParams.toString()}`;
        
        // Also save to sessionStorage as backup
        sessionStorage.setItem('pendingPlan', JSON.stringify(selectedPlan));
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: redirectTo
        }
      });

      if (error) {
        setError(error.message);
        setLoading(false);
      }
    } catch (error) {
      console.error('OAuth signup error:', error);
      setError('OAuth signup failed. Please try again.');
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            full_name: `${formData.firstName} ${formData.lastName}`
          }
        }
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (authData.user) {
        // Create user profile in database
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: formData.email,
            first_name: formData.firstName,
            last_name: formData.lastName,
            full_name: `${formData.firstName} ${formData.lastName}`,
            plan_type: selectedPlan?.type || 'Free',
            created_at: new Date().toISOString()
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          // Continue anyway, auth was successful
        }

        // Handle plan-specific logic
        if (selectedPlan && selectedPlan.type !== 'Free') {
          // For paid plans, redirect to payment
          const planParams = new URLSearchParams({
            plan: selectedPlan.type,
            tier: selectedPlan.subscribers.toString(),
            price: selectedPlan.price.toString()
          });
          router.push(`/auth/payment?${planParams.toString()}`);
        } else {
          // For free plan or no plan selected, go to dashboard
          router.push('/user-dashboard?welcome=true');
        }

        // Clear saved plan
        localStorage.removeItem('selectedPlan');
      }
    } catch (error) {
      console.error('Signup error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => {
    // Preserve plan information when going to login
    if (selectedPlan) {
      const planParams = new URLSearchParams({
        plan: selectedPlan.type,
        tier: selectedPlan.subscribers.toString(),
        price: selectedPlan.price.toString()
      });
      router.push(`/auth/login?${planParams.toString()}`);
    } else {
      router.push('/auth/login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <i className="fas fa-envelope-open-text text-3xl text-cyan-500 mr-2"></i>
            <span className="text-2xl font-bold text-cyan-500">Newsletterfy</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Create Your Account</h2>
          <p className="text-gray-600 mt-2">
            {selectedPlan 
              ? `Join Newsletterfy and start with the ${selectedPlan.type} plan`
              : 'Join Newsletterfy and start your newsletter journey'
            }
          </p>
        </div>

        {/* Selected Plan Display */}
        {selectedPlan && (
          <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-cyan-900">{selectedPlan.type} Plan</h3>
                <p className="text-sm text-cyan-700">
                  {selectedPlan.subscribers?.toLocaleString()} subscribers
                  {selectedPlan.price > 0 && ` - $${selectedPlan.price}/month`}
                </p>
              </div>
              <div className="text-cyan-600">
                {selectedPlan.type === 'Free' ? '🆓' : '💳'}
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSignup} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="John"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="Doe"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              placeholder="john@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent pr-10"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-gray-400`}></i>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password *
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="acceptTerms"
              checked={formData.acceptTerms}
              onChange={handleInputChange}
              className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300 rounded"
              required
            />
            <label className="ml-2 block text-sm text-gray-700">
              I agree to the <a href="/terms-of-service" className="text-cyan-600 hover:text-cyan-500">Terms of Service</a> and <a href="/privacy-policy" className="text-cyan-600 hover:text-cyan-500">Privacy Policy</a>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-500 text-white py-3 px-4 rounded-lg hover:bg-cyan-600 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating Account...
              </div>
            ) : (
              `Create Account${selectedPlan && selectedPlan.price > 0 ? ' & Continue to Payment' : ''}`
            )}
          </button>
        </form>

        {/* OAuth Divider */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>
        </div>

        {/* OAuth Buttons */}
        <div className="mt-6 space-y-3">
          <button
            onClick={() => handleOAuthSignup('github')}
            disabled={loading}
            className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="fab fa-github text-gray-900 mr-2"></i>
            Continue with GitHub
          </button>
          
          <button
            onClick={() => handleOAuthSignup('google')}
            disabled={loading}
            className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="fab fa-google text-red-500 mr-2"></i>
            Continue with Google
          </button>
        </div>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <button
              onClick={goToLogin}
              className="text-cyan-600 hover:text-cyan-500 font-medium"
            >
              Sign in
            </button>
          </p>
        </div>

        {/* Back to Home */}
        <div className="mt-4 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
} 