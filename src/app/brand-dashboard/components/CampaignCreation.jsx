"use client";
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  Target, 
  DollarSign, 
  Calendar,
  Users,
  Eye,
  MousePointer,
  Trash2,
  Plus
} from 'lucide-react';

export default function CampaignCreation({ 
  onClose, 
  onCampaignCreated, 
  brandProfile, 
  availableBalance 
}) {
  const [step, setStep] = useState(1); // 1: Basic Info, 2: Creative, 3: Targeting, 4: Budget & Schedule, 5: Review
  const [loading, setLoading] = useState(false);
  const [newsletters, setNewsletters] = useState([]);
  const [categories, setCategories] = useState([]);
  
  const [campaignData, setCampaignData] = useState({
    // Basic Info
    campaign_name: '',
    campaign_type: 'newsletter_placement',
    ad_title: '',
    ad_description: '',
    call_to_action: 'Learn More',
    landing_url: '',
    
    // Creative
    creative_files: [],
    creative_urls: [],
    
    // Targeting
    target_niches: [],
    target_newsletters: [],
    target_demographics: {
      age_ranges: [],
      genders: [],
      locations: []
    },
    target_interests: [],
    
    // Budget & Schedule
    budget_total: '',
    budget_daily: '',
    bid_type: 'cpm',
    bid_amount: '',
    start_date: '',
    end_date: '',
    
    // Settings
    frequency_cap: 3,
    priority_level: 1
  });

  useEffect(() => {
    fetchNewsletters();
    fetchCategories();
  }, []);

  const fetchNewsletters = async () => {
    try {
      const response = await fetch('/api/newsletters/public');
      if (response.ok) {
        const data = await response.json();
        setNewsletters(data.newsletters || []);
      }
    } catch (error) {
      console.error('Error fetching newsletters:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/newsletter-categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleFileUpload = async (files) => {
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'ad-creative');
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) throw new Error('Upload failed');
        
        const data = await response.json();
        return data.url;
      });
      
      const uploadedUrls = await Promise.all(uploadPromises);
      setCampaignData(prev => ({
        ...prev,
        creative_urls: [...prev.creative_urls, ...uploadedUrls]
      }));
      
      toast.success(`${uploadedUrls.length} file(s) uploaded successfully`);
    } catch (error) {
      toast.error('Failed to upload files');
      console.error(error);
    }
  };

  const removeCreative = (index) => {
    setCampaignData(prev => ({
      ...prev,
      creative_urls: prev.creative_urls.filter((_, i) => i !== index)
    }));
  };

  const handleTargetingChange = (field, value, checked) => {
    setCampaignData(prev => {
      if (field === 'target_niches' || field === 'target_newsletters' || field === 'target_interests') {
        const currentArray = prev[field];
        if (checked) {
          return { ...prev, [field]: [...currentArray, value] };
        } else {
          return { ...prev, [field]: currentArray.filter(item => item !== value) };
        }
      } else if (field.startsWith('target_demographics.')) {
        const subField = field.split('.')[1];
        const currentArray = prev.target_demographics[subField];
        if (checked) {
          return {
            ...prev,
            target_demographics: {
              ...prev.target_demographics,
              [subField]: [...currentArray, value]
            }
          };
        } else {
          return {
            ...prev,
            target_demographics: {
              ...prev.target_demographics,
              [subField]: currentArray.filter(item => item !== value)
            }
          };
        }
      }
      return prev;
    });
  };

  const validateStep = (stepNumber) => {
    switch (stepNumber) {
      case 1:
        return campaignData.campaign_name && campaignData.ad_title && campaignData.ad_description && campaignData.landing_url;
      case 2:
        return campaignData.creative_urls.length > 0;
      case 3:
        return campaignData.target_niches.length > 0 || campaignData.target_newsletters.length > 0;
      case 4:
        return campaignData.budget_total && campaignData.bid_amount && campaignData.start_date && campaignData.end_date;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    } else {
      toast.error('Please fill in all required fields');
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/brand/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...campaignData,
          brand_id: brandProfile.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create campaign');
      }

      const data = await response.json();
      onCampaignCreated(data.campaign);
      toast.success('Campaign created successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to create campaign');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="campaign_name">Campaign Name *</Label>
              <Input
                id="campaign_name"
                value={campaignData.campaign_name}
                onChange={(e) => setCampaignData(prev => ({ ...prev, campaign_name: e.target.value }))}
                placeholder="Enter campaign name"
              />
            </div>

            <div>
              <Label htmlFor="campaign_type">Campaign Type</Label>
              <Select 
                value={campaignData.campaign_type} 
                onValueChange={(value) => setCampaignData(prev => ({ ...prev, campaign_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newsletter_placement">Newsletter Placement</SelectItem>
                  <SelectItem value="sponsored_content">Sponsored Content</SelectItem>
                  <SelectItem value="banner_ad">Banner Ad</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="ad_title">Ad Title *</Label>
              <Input
                id="ad_title"
                value={campaignData.ad_title}
                onChange={(e) => setCampaignData(prev => ({ ...prev, ad_title: e.target.value }))}
                placeholder="Enter compelling ad title"
              />
            </div>

            <div>
              <Label htmlFor="ad_description">Ad Description *</Label>
              <Textarea
                id="ad_description"
                value={campaignData.ad_description}
                onChange={(e) => setCampaignData(prev => ({ ...prev, ad_description: e.target.value }))}
                placeholder="Describe your product or service"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="call_to_action">Call to Action</Label>
              <Select 
                value={campaignData.call_to_action} 
                onValueChange={(value) => setCampaignData(prev => ({ ...prev, call_to_action: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Learn More">Learn More</SelectItem>
                  <SelectItem value="Shop Now">Shop Now</SelectItem>
                  <SelectItem value="Sign Up">Sign Up</SelectItem>
                  <SelectItem value="Get Started">Get Started</SelectItem>
                  <SelectItem value="Download">Download</SelectItem>
                  <SelectItem value="Try Free">Try Free</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="landing_url">Landing URL *</Label>
              <Input
                id="landing_url"
                type="url"
                value={campaignData.landing_url}
                onChange={(e) => setCampaignData(prev => ({ ...prev, landing_url: e.target.value }))}
                placeholder="https://your-website.com/landing-page"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <Label>Upload Creative Assets *</Label>
              <div className="mt-2">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="hidden"
                    id="creative-upload"
                  />
                  <label htmlFor="creative-upload" className="cursor-pointer">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-900 mb-2">Upload ad creatives</p>
                    <p className="text-gray-600">
                      Drag and drop files here, or click to select
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Supports images and videos (max 10MB each)
                    </p>
                  </label>
                </div>
              </div>
            </div>

            {campaignData.creative_urls.length > 0 && (
              <div>
                <Label>Uploaded Creatives</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                  {campaignData.creative_urls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Creative ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      <button
                        onClick={() => removeCreative(index)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <Label>Target Niches *</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`niche-${category.id}`}
                      checked={campaignData.target_niches.includes(category.slug)}
                      onCheckedChange={(checked) => 
                        handleTargetingChange('target_niches', category.slug, checked)
                      }
                    />
                    <Label htmlFor={`niche-${category.id}`} className="text-sm">
                      {category.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Age Targeting</Label>
              <div className="grid grid-cols-3 gap-3 mt-3">
                {['18-24', '25-34', '35-44', '45-54', '55-64', '65+'].map((range) => (
                  <div key={range} className="flex items-center space-x-2">
                    <Checkbox
                      id={`age-${range}`}
                      checked={campaignData.target_demographics.age_ranges.includes(range)}
                      onCheckedChange={(checked) => 
                        handleTargetingChange('target_demographics.age_ranges', range, checked)
                      }
                    />
                    <Label htmlFor={`age-${range}`} className="text-sm">
                      {range}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Gender Targeting</Label>
              <div className="grid grid-cols-3 gap-3 mt-3">
                {['Male', 'Female', 'Non-binary'].map((gender) => (
                  <div key={gender} className="flex items-center space-x-2">
                    <Checkbox
                      id={`gender-${gender}`}
                      checked={campaignData.target_demographics.genders.includes(gender)}
                      onCheckedChange={(checked) => 
                        handleTargetingChange('target_demographics.genders', gender, checked)
                      }
                    />
                    <Label htmlFor={`gender-${gender}`} className="text-sm">
                      {gender}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="budget_total">Total Budget * ($)</Label>
                <Input
                  id="budget_total"
                  type="number"
                  min="50"
                  max={availableBalance}
                  value={campaignData.budget_total}
                  onChange={(e) => setCampaignData(prev => ({ ...prev, budget_total: e.target.value }))}
                  placeholder="1000"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Available balance: ${availableBalance.toFixed(2)}
                </p>
              </div>

              <div>
                <Label htmlFor="budget_daily">Daily Budget ($)</Label>
                <Input
                  id="budget_daily"
                  type="number"
                  value={campaignData.budget_daily}
                  onChange={(e) => setCampaignData(prev => ({ ...prev, budget_daily: e.target.value }))}
                  placeholder="50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bid_type">Bid Type</Label>
                <Select 
                  value={campaignData.bid_type} 
                  onValueChange={(value) => setCampaignData(prev => ({ ...prev, bid_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cpm">CPM (Cost per 1000 impressions)</SelectItem>
                    <SelectItem value="cpc">CPC (Cost per click)</SelectItem>
                    <SelectItem value="cpa">CPA (Cost per action)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="bid_amount">Bid Amount * ($)</Label>
                <Input
                  id="bid_amount"
                  type="number"
                  step="0.01"
                  value={campaignData.bid_amount}
                  onChange={(e) => setCampaignData(prev => ({ ...prev, bid_amount: e.target.value }))}
                  placeholder="5.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  id="start_date"
                  type="datetime-local"
                  value={campaignData.start_date}
                  onChange={(e) => setCampaignData(prev => ({ ...prev, start_date: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="end_date">End Date *</Label>
                <Input
                  id="end_date"
                  type="datetime-local"
                  value={campaignData.end_date}
                  onChange={(e) => setCampaignData(prev => ({ ...prev, end_date: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="frequency_cap">Frequency Cap</Label>
                <Input
                  id="frequency_cap"
                  type="number"
                  min="1"
                  max="10"
                  value={campaignData.frequency_cap}
                  onChange={(e) => setCampaignData(prev => ({ ...prev, frequency_cap: parseInt(e.target.value) }))}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Max times shown to same user
                </p>
              </div>

              <div>
                <Label htmlFor="priority_level">Priority Level</Label>
                <Select 
                  value={campaignData.priority_level.toString()} 
                  onValueChange={(value) => setCampaignData(prev => ({ ...prev, priority_level: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6,7,8,9,10].map(level => (
                      <SelectItem key={level} value={level.toString()}>
                        {level} {level === 1 ? '(Lowest)' : level === 10 ? '(Highest)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Review</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Campaign Details</h4>
                  <p><strong>Name:</strong> {campaignData.campaign_name}</p>
                  <p><strong>Type:</strong> {campaignData.campaign_type}</p>
                  <p><strong>Title:</strong> {campaignData.ad_title}</p>
                  <p><strong>Description:</strong> {campaignData.ad_description}</p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Budget & Schedule</h4>
                  <p><strong>Total Budget:</strong> ${campaignData.budget_total}</p>
                  <p><strong>Bid Amount:</strong> ${campaignData.bid_amount} ({campaignData.bid_type.toUpperCase()})</p>
                  <p><strong>Duration:</strong> {new Date(campaignData.start_date).toLocaleDateString()} - {new Date(campaignData.end_date).toLocaleDateString()}</p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Targeting</h4>
                  <div className="flex flex-wrap gap-2">
                    {campaignData.target_niches.map(niche => (
                      <Badge key={niche} variant="secondary">{niche}</Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Creatives</h4>
                  <p>{campaignData.creative_urls.length} creative(s) uploaded</p>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  const stepTitles = [
    'Basic Information',
    'Creative Assets',
    'Targeting',
    'Budget & Schedule',
    'Review & Submit'
  ];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Sponsored Ad Campaign</DialogTitle>
          <DialogDescription>
            Step {step} of 5: {stepTitles[step - 1]}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
          >
            {step > 1 ? 'Back' : 'Cancel'}
          </Button>

          <div className="space-x-2">
            {step < 5 ? (
              <Button onClick={handleNext} disabled={!validateStep(step)}>
                Next
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? 'Creating...' : 'Create Campaign'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 