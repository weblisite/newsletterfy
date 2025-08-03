"use client";
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, DollarSign, Target, CheckCircle, XCircle, Clock, Users, Edit, Send } from 'lucide-react';

export default function SponsoredAdOpportunities({ opportunities, onRefresh, onPushToNewsletter }) {
  const [processingId, setProcessingId] = useState(null);
  const [showAcceptModal, setShowAcceptModal] = useState(null);
  const [publicationDate, setPublicationDate] = useState('');
  const [acceptedOpportunities, setAcceptedOpportunities] = useState(new Set());

  const handleOpportunityAction = async (opportunityId, action, selectedDate = null) => {
    try {
      setProcessingId(opportunityId);
      
      const response = await fetch('/api/sponsored-ads/opportunities', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          opportunityId,
          action, // 'accept' or 'decline'
          publicationDate: selectedDate,
        }),
      });

      if (response.ok) {
        toast.success(`Opportunity ${action}ed successfully`);
        if (action === 'accept' && selectedDate) {
          setAcceptedOpportunities(prev => new Set(prev).add(opportunityId));
          toast.success(`🎉 Ad scheduled for ${new Date(selectedDate).toLocaleDateString()}. You can now add it to your newsletter!`);
        }
        onRefresh();
        setShowAcceptModal(null);
        setPublicationDate('');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || `Failed to ${action} opportunity`);
      }
    } catch (error) {
      console.error(`Error ${action}ing opportunity:`, error);
      toast.error(`Failed to ${action} opportunity`);
    } finally {
      setProcessingId(null);
    }
  };

  const handlePushToNewsletter = async (opportunity) => {
    try {
      // Generate ad content for the newsletter
      const response = await fetch('/api/newsletter/ad-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          opportunityId: opportunity.id,
          placement: 'middle'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Pass the ad content to parent component to include in newsletter
        if (onPushToNewsletter) {
          onPushToNewsletter(data.adContent);
          toast.success('Ad content pushed to newsletter editor!');
        } else {
          // Fallback: copy to clipboard
          navigator.clipboard.writeText(data.adContent.html);
          toast.success('Ad HTML copied to clipboard! You can paste it into your newsletter.');
        }
      } else {
        throw new Error('Failed to generate ad content');
      }
    } catch (error) {
      console.error('Error pushing to newsletter:', error);
      toast.error('Failed to push ad to newsletter');
    }
  };

  const calculatePotentialEarnings = (opportunity) => {
    if (opportunity.pricing_model === 'cpc') {
      const estimatedClicks = (opportunity.target_impressions || 1000) * 0.02;
      return estimatedClicks * opportunity.cost_per_click * 0.8;
    } else if (opportunity.pricing_model === 'cpm') {
      const estimatedImpressions = opportunity.target_impressions || 1000;
      return (estimatedImpressions / 1000) * opportunity.cost_per_mille * 0.8;
    }
    return 0;
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = (opportunity) => {
    if (opportunity && opportunity.end_date) {
      return new Date(opportunity.end_date).toISOString().split('T')[0];
    }
    // Default to 1 year from now if no end date for maximum flexibility
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1);
    return maxDate.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="text-lg font-medium text-gray-900">Sponsored Ad Opportunities</h4>
          <p className="text-sm text-gray-600">Accept opportunities that match your newsletter audience</p>
        </div>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors text-sm"
        >
          <i className="fas fa-sync-alt mr-2"></i>
          Refresh
        </button>
      </div>

      {opportunities.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No opportunities available</h3>
              <p className="text-gray-600 mb-4">New sponsored ad opportunities will appear here when brands create campaigns that match your newsletter criteria.</p>
              <div className="bg-cyan-50 rounded-lg p-4 mt-6">
                <h4 className="font-medium text-cyan-900 mb-2">How it works:</h4>
                <ul className="text-sm text-cyan-700 space-y-1 text-left max-w-md mx-auto">
                  <li>• Brands create sponsored ads with specific audience criteria</li>
                  <li>• System automatically matches ads to your newsletter profile</li>
                  <li>• You receive opportunities to accept or decline</li>
                  <li>• Accept ads, select publication date, and push to newsletter creation</li>
                  <li>• Earn 80% revenue share from sponsored content</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {opportunities.map((opportunity) => (
            <Card key={opportunity.id} className="border-l-4 border-l-green-400">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg text-gray-900">
                      {opportunity.title || opportunity.brand_name || 'Sponsored Ad Opportunity'}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      By: {opportunity.brand_name || 'Anonymous Brand'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <Clock className="h-3 w-3 mr-1" />
                      Available
                    </Badge>
                    {opportunity.end_date && (
                      <Badge variant="outline" className="text-orange-600 border-orange-200">
                        <Calendar className="h-3 w-3 mr-1" />
                        Until {new Date(opportunity.end_date).toLocaleDateString()}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <p className="text-sm text-gray-600">Pricing Model</p>
                        <p className="font-medium">
                          {opportunity.pricing_model === 'cpc' ? 
                            `$${opportunity.cost_per_click} per click` : 
                            `$${opportunity.cost_per_mille} per 1K views`
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Target className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <p className="text-sm text-gray-600">Target Audience</p>
                        <p className="font-medium">{opportunity.target_audience || 'General'}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <p className="text-sm text-gray-600">Target Impressions</p>
                        <p className="font-medium">{(opportunity.target_impressions || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {opportunity.ad_content && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900 mb-2">Ad Content Preview</h5>
                      <div className="border rounded-lg p-3 bg-white">
                        <p className="text-sm text-gray-700">{opportunity.ad_content}</p>
                        {opportunity.call_to_action && (
                          <div className="mt-2">
                            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                              CTA: {opportunity.call_to_action}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium text-green-900">Your Potential Earnings (80% Share)</h5>
                        <p className="text-sm text-green-700">
                          Based on {opportunity.pricing_model === 'cpc' ? 'estimated clicks' : 'target impressions'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-900">
                          ${calculatePotentialEarnings(opportunity).toFixed(2)}
                        </p>
                        <p className="text-xs text-green-600">Estimated earnings</p>
                      </div>
                    </div>
                  </div>

                  {acceptedOpportunities.has(opportunity.id) ? (
                    <div className="space-y-3">
                      <div className="bg-green-100 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                          <div>
                            <p className="font-medium text-green-900">Opportunity Accepted!</p>
                            <p className="text-sm text-green-700">You can now push this ad to your newsletter editor.</p>
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => handlePushToNewsletter(opportunity)}
                        className="w-full bg-cyan-500 hover:bg-cyan-600 text-white"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Push to Newsletter
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                        <Button
                          onClick={() => {
                            setShowAcceptModal(opportunity.id);
                            setPublicationDate(getMinDate()); // Set default to today
                          }}
                          disabled={processingId === opportunity.id}
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                        >
                          {processingId === opportunity.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-2" />
                          )}
                          Accept & Schedule
                        </Button>
                        <Button
                          onClick={() => handleOpportunityAction(opportunity.id, 'decline')}
                          disabled={processingId === opportunity.id}
                          variant="outline"
                          className="flex-1 border-gray-300 text-gray-600 hover:bg-gray-50"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Decline
                        </Button>
                      </div>
                      
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-700">
                          💡 Accept this opportunity first to unlock the "Push to Newsletter" feature.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showAcceptModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule Publication Date</h3>
            <p className="text-sm text-gray-600 mb-4">
              Select when you want to publish this sponsored ad in your newsletter:
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Publication Date
              </label>
              <input
                type="date"
                value={publicationDate}
                onChange={(e) => setPublicationDate(e.target.value)}
                min={getMinDate()}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500 text-gray-900"
                style={{ colorScheme: 'light' }}
                required
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                Select any future date for your newsletter publication. Campaign is available until: {getMaxDate(opportunities.find(op => op.id === showAcceptModal))}
              </p>
            </div>

            <div className="bg-blue-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-700">
                💡 After accepting, you'll be able to push the ad content directly to your newsletter editor.
              </p>
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={() => {
                  setShowAcceptModal(null);
                  setPublicationDate('');
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleOpportunityAction(showAcceptModal, 'accept', publicationDate)}
                disabled={!publicationDate || processingId === showAcceptModal}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white"
              >
                {processingId === showAcceptModal ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Accept Opportunity
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 