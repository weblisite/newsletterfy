"use client";
import React from "react";

function MainComponent() {
  const [showPopup, setShowPopup] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [selectedPhase, setSelectedPhase] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [targetSubscribers, setTargetSubscribers] = useState(1000);
  const [selectedFaq, setSelectedFaq] = useState(null);
  const [timeframe, setTimeframe] = useState(3);
  const [calculatedBudget, setCalculatedBudget] = useState(null);
  const [email, setEmail] = useState("");
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [showThankYou, setShowThankYou] = useState(false);
  const [growthEstimate, setGrowthEstimate] = useState(null);
  const [currentSubscribers, setCurrentSubscribers] = useState(0);
  const guides = [
    {
      id: 1,
      title: "Newsletter Growth Strategies",
      description: "Learn the exact tactics we use to grow newsletters fast",
      icon: "fas fa-rocket",
      downloadUrl: "https://socialitix.com/guides/newsletter-growth.pdf",
    },
    {
      id: 2,
      title: "Social Media Ad Templates",
      description: "Ready-to-use templates for Twitter and TikTok ads",
      icon: "fas fa-copy",
      downloadUrl: "https://socialitix.com/guides/ad-templates.pdf",
    },
    {
      id: 3,
      title: "Newsletter Monetization Guide",
      description: "Turn your subscriber base into a profitable business",
      icon: "fas fa-dollar-sign",
      downloadUrl: "https://socialitix.com/guides/monetization.pdf",
    },
  ];
  const handleDownload = (guide) => {
    setSelectedGuide(guide);
    setShowPopup(true);
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (email && selectedGuide) {
      setShowThankYou(true);
      setTimeout(() => {
        setShowPopup(false);
        setShowThankYou(false);
        setEmail("");
        window.open(selectedGuide.downloadUrl, "_blank");
      }, 2000);
    }
  };
  const calculateBudget = useCallback(() => {
    const effectiveSubscribers =
      currentSubscribers === 0 ? 1 : currentSubscribers;
    const baseRate = 0.5;
    const monthlyFactor = timeframe <= 3 ? 1.2 : 1;
    const growthTarget = targetSubscribers - currentSubscribers;
    const estimatedBudget = Math.round(
      (growthTarget * baseRate * monthlyFactor) / timeframe
    );

    const growthPercentage =
      currentSubscribers === 0
        ? targetSubscribers * 100
        : Math.round(
            ((targetSubscribers - currentSubscribers) / currentSubscribers) *
              100
          );

    setGrowthEstimate(growthPercentage);
    setCalculatedBudget(estimatedBudget);
  }, [targetSubscribers, timeframe, currentSubscribers]);
  const handleCalendlyClick = () => {
    window.location.href = "https://calendly.com/socialitix/meeting";
  };
  const handlePaymentClick = (plan) => {
    if (!plan) return;
    if (plan === "starter") {
      window.location.href = "https://wise.com/pay/r/ukSOK5iOsI-zlF4";
    } else if (plan === "starter_yearly") {
      window.location.href = "https://wise.com/pay/r/XTbIxhD8yi3Qfrs";
    } else if (plan === "pro") {
      window.location.href = "https://wise.com/pay/r/TZdFn32uFplHG94";
    } else if (plan === "pro_yearly") {
      window.location.href = "https://wise.com/pay/r/2G6ZEJ1JxvJXdSU";
    } else if (plan === "enterprise") {
      window.location.href = "https://wise.com/pay/r/aNK9aCDYSP2AHFc";
    } else if (plan === "enterprise_yearly") {
      window.location.href = "https://wise.com/pay/r/3sI7iuf3Qf-5Jqg";
    } else {
      window.location.href = "https://calendly.com/socialitix/meeting";
    }
  };

  useEffect(() => {
    const handleMouseLeave = (e) => {
      if (e.clientY <= 0) {
        setShowPopup(true);
      }
    };
    window.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  const faqs = [
    {
      question: "What is the minimum Ad budget required to start?",
      answer:
        "Our starter plans begin with a minimum Ad budget of $100 per month. However, we recommend scaling your budget based on your subscriber goals and timeline.",
    },
    {
      question: "How long does it take to see results?",
      answer:
        "Most clients see initial results within 2-4 weeks. However, sustainable growth typically becomes evident after 2-3 months of consistent campaign optimization.",
    },
    {
      question: "Do you offer refunds if we don't see growth?",
      answer:
        "Yes, we offer a 30-day money-back guarantee if you don't see any measurable subscriber growth within the first month of campaign execution.",
    },
    {
      question: "Which platform performs better - Twitter or TikTok?",
      answer:
        "Performance varies based on your target audience and content type. Twitter typically works better for professional/industry newsletters, while TikTok excels for lifestyle and entertainment content.",
    },
    {
      question: "What's included in the management fee?",
      answer:
        "Our management fee covers campaign strategy, ad creative development, audience targeting, daily monitoring, performance optimization, and regular reporting.",
    },
    {
      question: "Can I pause or cancel my campaign?",
      answer:
        "Yes, you can pause or cancel your campaign at any time with 30 days' notice. There are no long-term contracts or cancellation fees.",
    },
    {
      question: "Do you help with Ad creative and copy?",
      answer:
        "Yes, our team handles all aspects of Ad creative development, including copywriting, design, and A/B testing variations.",
    },
    {
      question: "How do you measure campaign success?",
      answer:
        "We track key metrics including subscriber growth, engagement rates, click-through rates, cost per subscriber, and overall ROI.",
    },
    {
      question: "What targeting options are available?",
      answer:
        "We offer detailed targeting based on demographics, interests, behaviors, lookalike audiences, and custom audience segments.",
    },
    {
      question: "Do you integrate with my existing tools?",
      answer:
        "Yes, we can integrate with most major email marketing platforms and analytics tools to ensure seamless tracking and reporting.",
    },
    {
      question: "What happens after I sign up?",
      answer:
        "After signing up, you'll have an initial consultation call where we'll discuss your goals, review your current newsletter, and develop a customized growth strategy.",
    },
    {
      question: "Do you provide performance reports?",
      answer:
        "Yes, we provide detailed weekly performance reports and a real-time dashboard showing key metrics like subscriber growth, engagement rates, and ROI.",
    },
    {
      question: "Can you help with landing page optimization?",
      answer:
        "Yes, we optimize your newsletter landing pages to improve conversion rates and ensure they align with your ad campaigns.",
    },
    {
      question: "What makes your service different?",
      answer:
        "We specialize exclusively in newsletter growth through social media ads, with proven strategies that have helped over 100+ newsletters scale their subscriber base.",
    },
    {
      question: "Do you handle Ad spend management?",
      answer:
        "Yes, we manage your entire Ad budget, optimizing spend across platforms to achieve the best possible cost per subscriber.",
    },
  ];
  const plans = {
    starter: {
      name: "Growth Starter",
      monthlyPrice: 997,
      yearlyPrice: 797,
      features: [
        "Single platform campaign management",
        "Basic audience targeting",
        "Monthly strategy calls",
        "Weekly performance reports",
        "Email support",
      ],
      adBudget: "$100-$3,000",
      subscribers: "Gain up to 5,000 Subscribers",
    },
    pro: {
      name: "Growth Booster",
      monthlyPrice: 1997,
      yearlyPrice: 1597,
      features: [
        "Dual platform campaign management",
        "Advanced audience targeting",
        "Bi-weekly strategy calls",
        "Daily performance reports",
        "Priority email & chat support",
        "Custom ad creative development",
        "A/B testing",
      ],
      adBudget: "$3,000-$6,000",
      subscribers: "Gain up to 10,000 Subscribers",
    },
    enterprise: {
      name: "Growth Scaler",
      monthlyPrice: 2997,
      yearlyPrice: 2397,
      features: [
        "Multi-platform campaign management",
        "Premium audience targeting",
        "Weekly strategy calls",
        "Real-time performance dashboard",
        "24/7 dedicated support",
        "Custom ad creative & copywriting",
        "Advanced A/B testing",
        "Custom reporting",
        "ROI optimization",
      ],
      adBudget: "$9,000+",
      subscribers: "Gain over 15,000 Subscribers",
    },
  };
  const timeline = [
    {
      title: "Free Consultation",
      description: "We analyze your newsletter and target audience",
      icon: "fas fa-handshake",
      duration: "30 minutes",
      details: [
        "In-depth discussion of your newsletter goals",
        "Analysis of current subscriber base",
        "Review of existing marketing efforts",
        "Competitor analysis overview",
        "Initial budget planning",
      ],
      deliverables: "Preliminary growth strategy recommendation and proposal",
    },
    {
      title: "Strategy Planning",
      description: "Custom growth plan tailored to your specific goals",
      icon: "fas fa-lightbulb",
      duration: "3 days",
      details: [
        "Detailed audience persona development",
        "Platform-specific strategy creation",
        "Custom targeting parameters",
        "Content strategy blueprint",
        "Budget allocation plan",
      ],
      deliverables: "Comprehensive strategy document and campaign roadmap",
    },
    {
      title: "Campaign Setup",
      description: "Ad creative development and audience targeting",
      icon: "fas fa-cogs",
      duration: "1 week",
      details: [
        "Ad creative design and copywriting",
        "Audience targeting setup",
        "Tracking pixel implementation",
        "A/B test preparation",
        "Landing page optimization",
      ],
      deliverables: "Ready-to-launch campaigns with complete creative assets",
    },
    {
      title: "Launch & Monitor",
      description: "Campaign activation and performance tracking",
      icon: "fas fa-rocket",
      duration: "Ongoing",
      details: [
        "Campaign launch sequence",
        "Real-time performance monitoring",
        "Daily performance checks",
        "Audience response analysis",
        "Initial optimization adjustments",
      ],
      deliverables:
        "Daily performance reports and optimization recommendations",
    },
    {
      title: "Optimize & Scale",
      description: "Data-driven improvements and scaling strategies",
      icon: "fas fa-chart-line",
      duration: "Weekly",
      details: [
        "Performance data analysis",
        "Budget optimization",
        "Creative refresh implementation",
        "Audience expansion",
        "ROI maximization strategies",
      ],
      deliverables: "Weekly optimization reports and scaling recommendations",
    },
  ];
  const services = {
    strategy: {
      title: "Advertising Strategy",
      description: "Custom growth strategies for your newsletter",
      features: [
        "Comprehensive audience analysis",
        "Content strategy development",
        "Cross-platform campaign coordination",
        "Budget optimization planning",
        "ROI tracking and reporting",
      ],
      metrics: "Proven strategies across 100+ newsletters",
    },
    twitter: {
      title: "Twitter Ad Campaigns",
      description:
        "Drive newsletter growth through strategic Twitter advertising",
      features: [
        "Targeted audience segmentation based on interests and behaviors",
        "Custom ad creative optimized for Twitter's format",
        "Engagement-focused campaign strategies",
        "Performance tracking and analytics",
        "A/B testing of ad content and targeting",
      ],
      metrics: "Average 150% increase in subscriber growth",
    },
    tiktok: {
      title: "TikTok Ad Campaigns",
      description: "Capture younger audiences with engaging video content",
      features: [
        "Trending content analysis and implementation",
        "Video ad creation and optimization",
        "Demographic-specific targeting",
        "Influencer collaboration strategies",
        "Performance monitoring and optimization",
      ],
      metrics: "Average 200% increase in Gen-Z subscribers",
    },
    optimization: {
      title: "Campaign Optimization",
      description: "Continuous improvement of campaign performance",
      features: [
        "Real-time performance monitoring",
        "Data-driven optimization",
        "Budget allocation adjustment",
        "Creative refresh recommendations",
        "Weekly performance reports",
      ],
      metrics: "30% average improvement in conversion rates",
    },
  };
  const caseStudies = [
    {
      client: "Remote Opps",
      industry: "Work Newsletter",
      challenge: "Struggling to reach working professionals",
      solution: "Targeted Twitter campaign with custom audience",
      results: {
        subscribers: "2,500 to 10,034",
        timeframe: "3 months",
        growth: "301%",
        engagement: "20.72%",
        ctr: "14.91%",
        cpa: "$0.75",
        roi: "385%",
        demographics: "25-45, Working Professionals",
      },
      quote:
        "Socialitix transformed our subscriber acquisition strategy. Their Twitter campaigns helped us reach exactly the right audience.",
      author: "Editor",
    },
    {
      client: "Remote Job",
      industry: "Jobs Newsletter",
      challenge: "High CPA on traditional platforms",
      solution: "Multi-platform strategy across Twitter and TikTok",
      results: {
        subscribers: "1,000 to 9,354",
        timeframe: "4 months",
        growth: "835%",
        engagement: "23.12%",
        ctr: "9.78%",
        cpa: "$0.60",
        roi: "450%",
        demographics: "24-44, Job Industry",
      },
      quote:
        "The ROI we've seen with Socialitix has been incredible. They truly understand how to acquire newsletter subscribers.",
      author: "Founder",
    },
    {
      client: "Remote Working",
      industry: "Work Newsletter",
      challenge: "Limited reach in younger demographics",
      solution: "TikTok-focused campaign with influencer partnerships",
      results: {
        subscribers: "500 to 7657",
        timeframe: "3 months",
        growth: "1431%",
        engagement: "22.9%",
        ctr: "8.53%",
        cpa: "$0.45",
        roi: "520%",
        demographics: "18-35, Remote Workers",
      },
      quote:
        "Our TikTok strategy completely changed our subscriber demographics. We're now reaching a whole new audience.",
      author: "Content Director",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <link
        rel="icon"
        href="https://ucarecdn.com/9761aa46-d461-4211-bdd3-7bf5ff04232f/-/format/auto/"
        type="image/png"
      />
      <nav className="fixed w-full bg-white shadow-md z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <img
              src="https://ucarecdn.com/d7679f26-8138-444b-be88-457c9f0651ad/-/format/auto/"
              alt="Socialitix logo showing an orange X symbol with black text"
              className="h-10"
            />
          </div>
          <button
            onClick={handleCalendlyClick}
            className="bg-[#FF4D4D] text-white px-6 py-2 rounded-full font-montserrat hover:bg-[#ff3333] transition-colors"
          >
            Book a Call
          </button>
        </div>
      </nav>
      <div className="pt-24">
        <section className="container mx-auto px-4 py-12 md:py-16">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold font-montserrat text-[#1a1a1a] mb-6">
              Boost Your Newsletter Growth with Targeted Social Media Ads
            </h1>
            <p className="text-xl md:text-2xl text-[#666] mb-8 font-roboto">
              Accelerate subscriber growth with our proven Twitter & TikTok Ad
              strategies
            </p>
            <button
              onClick={handleCalendlyClick}
              className="bg-[#FF4D4D] text-white px-8 py-4 rounded-full text-lg font-montserrat hover:bg-[#ff3333] transition-colors mb-8"
            >
              Book a Free Call
            </button>
            <p className="text-xl md:text-2xl text-[#666] mb-12 font-roboto">
              Grow your newsletter subscribers with Socialitix's data-driven
              advertising
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6 mt-12 mb-12">
            <div className="bg-white p-6 rounded-xl shadow-lg text-center">
              <div className="text-2xl md:text-3xl font-bold font-montserrat text-[#FF4D4D]">
                1.5M+
              </div>
              <div className="text-sm md:text-base font-roboto text-[#666]">
                New Subscribers
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg text-center">
              <div className="text-2xl md:text-3xl font-bold font-montserrat text-[#FF4D4D]">
                $0.60
              </div>
              <div className="text-sm md:text-base font-roboto text-[#666]">
                Avg. Cost Per Sub
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg text-center">
              <div className="text-2xl md:text-3xl font-bold font-montserrat text-[#FF4D4D]">
                175%
              </div>
              <div className="text-sm md:text-base font-roboto text-[#666]">
                Subscriber Growth
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg text-center">
              <div className="text-2xl md:text-3xl font-bold font-montserrat text-[#FF4D4D]">
                11%
              </div>
              <div className="text-sm md:text-base font-roboto text-[#666]">
                Click-Through Rate
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg text-center">
              <div className="text-2xl md:text-3xl font-bold font-montserrat text-[#FF4D4D]">
                98%
              </div>
              <div className="text-sm md:text-base font-roboto text-[#666]">
                Success Rate
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg text-center">
              <div className="text-2xl md:text-3xl font-bold font-montserrat text-[#FF4D4D]">
                46%
              </div>
              <div className="text-sm md:text-base font-roboto text-[#666]">
                Open Rate
              </div>
            </div>
          </div>
          <div className="bg-[#f8f8f8] py-8">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-4xl font-bold font-montserrat mb-8">
                  About Socialitix
                </h2>
                <p className="text-lg text-[#666] font-roboto mb-6">
                  Socialitix is the leading newsletter growth agency
                  specializing in social media advertising. Our team of experts
                  has helped over 100+ newsletters scale their subscriber base
                  through targeted Twitter and TikTok campaigns.
                </p>
                <p className="text-lg text-[#666] font-roboto mb-6">
                  We combine data-driven strategies with creative excellence to
                  deliver exceptional results for our clients. Our proven
                  methodology has generated over 1.5M+ new subscribers across
                  various newsletters.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                  <div className="text-center">
                    <i className="fas fa-users text-4xl text-[#FF4D4D] mb-4"></i>
                    <h3 className="text-xl font-bold font-montserrat mb-2">
                      Expert Team
                    </h3>
                    <p className="text-[#666] font-roboto">
                      Dedicated specialists in newsletter growth and social
                      media advertising
                    </p>
                  </div>
                  <div className="text-center">
                    <i className="fas fa-chart-bar text-4xl text-[#FF4D4D] mb-4"></i>
                    <h3 className="text-xl font-bold font-montserrat mb-2">
                      Data-Driven
                    </h3>
                    <p className="text-[#666] font-roboto">
                      Results-focused approach with transparent reporting and
                      optimization
                    </p>
                  </div>
                  <div className="text-center">
                    <i className="fas fa-trophy text-4xl text-[#FF4D4D] mb-4"></i>
                    <h3 className="text-xl font-bold font-montserrat mb-2">
                      Proven Results
                    </h3>
                    <p className="text-[#666] font-roboto">
                      Consistent success across diverse newsletter niches and
                      audiences
                    </p>
                  </div>
                </div>
                <div className="mt-12 text-center">
                  <p className="text-lg text-[#666] font-roboto mb-6">
                    Ready to transform your newsletter growth?
                  </p>
                  <button
                    onClick={handleCalendlyClick}
                    className="bg-[#FF4D4D] text-white px-8 py-4 rounded-full text-lg font-montserrat hover:bg-[#ff3333] transition-colors"
                  >
                    Start Growing Your Newsletter
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12">
            <h2 className="text-3xl font-bold font-montserrat text-center mb-8">
              What We Do Best
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 bg-white rounded-xl shadow-lg">
                <i className="fas fa-chart-line text-3xl text-[#FF4D4D] mb-4"></i>
                <h3 className="text-xl font-bold font-montserrat mb-3">
                  Ad Strategy
                </h3>
                <p className="text-[#666] font-roboto mb-4">
                  Custom growth strategies tailored to your newsletter
                </p>
                <button
                  onClick={handleCalendlyClick}
                  className="w-full bg-[#FF4D4D] text-white px-4 py-2 rounded-full font-montserrat hover:bg-[#ff3333] transition-colors text-sm"
                >
                  Get Custom Strategy
                </button>
              </div>
              <div className="p-6 bg-white rounded-xl shadow-lg">
                <i className="fab fa-twitter text-3xl text-[#1DA1F2] mb-4"></i>
                <h3 className="text-xl font-bold font-montserrat mb-3">
                  Twitter Ads
                </h3>
                <p className="text-[#666] font-roboto mb-4">
                  Strategic Twitter Ad campaigns targeting your ideal
                  subscribers
                </p>
                <button
                  onClick={handleCalendlyClick}
                  className="w-full bg-[#FF4D4D] text-white px-4 py-2 rounded-full font-montserrat hover:bg-[#ff3333] transition-colors text-sm"
                >
                  Get Twitter Strategy
                </button>
              </div>
              <div className="p-6 bg-white rounded-xl shadow-lg">
                <i className="fab fa-tiktok text-3xl text-[#000000] mb-4"></i>
                <h3 className="text-xl font-bold font-montserrat mb-3">
                  TikTok Ads
                </h3>
                <p className="text-[#666] font-roboto mb-4">
                  Engaging video ad campaigns to capture younger audiences
                </p>
                <button
                  onClick={handleCalendlyClick}
                  className="w-full bg-[#FF4D4D] text-white px-4 py-2 rounded-full font-montserrat hover:bg-[#ff3333] transition-colors text-sm"
                >
                  Get TikTok Strategy
                </button>
              </div>
              <div className="p-6 bg-white rounded-xl shadow-lg">
                <i className="fas fa-sliders-h text-3xl text-[#FF4D4D] mb-4"></i>
                <h3 className="text-xl font-bold font-montserrat mb-3">
                  Optimization
                </h3>
                <p className="text-[#666] font-roboto mb-4">
                  Continuous campaign optimization for maximum ROI
                </p>
                <button
                  onClick={handleCalendlyClick}
                  className="w-full bg-[#FF4D4D] text-white px-4 py-2 rounded-full font-montserrat hover:bg-[#ff3333] transition-colors text-sm"
                >
                  Optimize My Campaigns
                </button>
              </div>
            </div>
          </div>
          <div className="mt-16">
            {Object.entries(services).map(([key, service]) => (
              <div
                key={key}
                className="mb-12 p-6 bg-white rounded-xl shadow-lg"
              >
                <h2 className="text-3xl font-bold font-montserrat text-[#1a1a1a] mb-4">
                  {service.title}
                </h2>
                <p className="text-xl text-[#666] mb-8 font-roboto">
                  {service.description}
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xl font-bold font-montserrat mb-4 text-[#FF4D4D]">
                      Key Features
                    </h3>
                    <ul className="space-y-3">
                      {service.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <i className="fas fa-check-circle text-[#FF4D4D] mt-1 mr-2"></i>
                          <span className="font-roboto text-[#666]">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-[#f8f8f8] p-6 rounded-xl">
                    <h3 className="text-xl font-bold font-montserrat mb-4 text-[#1a1a1a]">
                      Performance Metrics
                    </h3>
                    <p className="text-lg font-roboto text-[#666]">
                      {service.metrics}
                    </p>
                    <button
                      onClick={handleCalendlyClick}
                      className="mt-6 bg-[#FF4D4D] text-white px-6 py-3 rounded-full font-montserrat hover:bg-[#ff3333] transition-colors w-full"
                    >
                      Learn More
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-24 mb-24">
            <h2 className="text-4xl font-bold font-montserrat text-center mb-8">
              Your Growth Journey
            </h2>
            <p className="text-xl text-[#666] text-center mb-16 font-roboto">
              A proven process to scale your newsletter subscribers
            </p>
            <div className="relative">
              <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-[#FF4D4D] -translate-y-1/2"></div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                {timeline.map((step, index) => (
                  <div
                    key={index}
                    className={`relative p-6 rounded-xl bg-white shadow-lg transition-all duration-300 cursor-pointer ${
                      activeStep === index ? "scale-105" : ""
                    } ${
                      selectedPhase === index ? "ring-2 ring-[#FF4D4D]" : ""
                    }`}
                    onMouseEnter={() => setActiveStep(index)}
                    onClick={() =>
                      setSelectedPhase(selectedPhase === index ? null : index)
                    }
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 rounded-full bg-[#FF4D4D] text-white flex items-center justify-center mb-4">
                        <i className={`${step.icon} text-2xl`}></i>
                      </div>
                      <h3 className="text-xl font-bold font-montserrat mb-2">
                        {step.title}
                      </h3>
                      <p className="text-[#666] font-roboto mb-4">
                        {step.description}
                      </p>
                      <span className="text-sm font-bold text-[#FF4D4D] font-montserrat">
                        {step.duration}
                      </span>
                    </div>
                    {selectedPhase === index && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="font-bold font-montserrat mb-2 text-[#FF4D4D]">
                          What to Expect:
                        </h4>
                        <ul className="space-y-2 text-sm text-[#666]">
                          {step.details.map((detail, i) => (
                            <li key={i} className="flex items-start">
                              <i className="fas fa-check text-[#FF4D4D] mt-1 mr-2"></i>
                              <span>{detail}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-4">
                          <p className="text-sm font-bold text-[#666]">
                            Deliverables:
                          </p>
                          <p className="text-sm text-[#666]">
                            {step.deliverables}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="text-center mt-12">
              <button
                onClick={handleCalendlyClick}
                className="bg-[#FF4D4D] text-white px-8 py-4 rounded-full text-lg font-montserrat hover:bg-[#ff3333] transition-colors"
              >
                Start Growing Your Newsletter
              </button>
            </div>
          </div>

          <div className="mt-24 mb-24">
            <h2 className="text-4xl font-bold font-montserrat text-center mb-8">
              Client Success Stories
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {caseStudies.map((study, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg p-8">
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold font-montserrat mb-2">
                      {study.client}
                    </h3>
                    <p className="text-[#666] font-roboto">{study.industry}</p>
                  </div>
                  <div className="mb-6">
                    <h4 className="font-bold font-montserrat mb-2">
                      Challenge:
                    </h4>
                    <p className="text-[#666] font-roboto">{study.challenge}</p>
                  </div>
                  <div className="mb-6">
                    <h4 className="font-bold font-montserrat mb-2">
                      Solution:
                    </h4>
                    <p className="text-[#666] font-roboto">{study.solution}</p>
                  </div>
                  <button
                    onClick={handleCalendlyClick}
                    className="w-full bg-[#FF4D4D] text-white px-4 py-2 rounded-full font-montserrat hover:bg-[#ff3333] transition-colors text-sm mb-6"
                  >
                    Get Similar Results
                  </button>

                  <div className="bg-[#f8f8f8] p-4 rounded-lg mb-6">
                    <h4 className="font-bold font-montserrat mb-4">Results:</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-[#666] font-roboto">
                          Subscribers
                        </p>
                        <p className="text-lg font-bold font-montserrat">
                          {study.results.subscribers}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-[#666] font-roboto">
                          Timeframe
                        </p>
                        <p className="text-lg font-bold font-montserrat">
                          {study.results.timeframe}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-[#666] font-roboto">
                          Growth
                        </p>
                        <p className="text-lg font-bold font-montserrat text-[#FF4D4D]">
                          {study.results.growth}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-[#666] font-roboto">CTR</p>
                        <p className="text-lg font-bold font-montserrat">
                          {study.results.ctr}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-[#666] font-roboto">CPA</p>
                        <p className="text-lg font-bold font-montserrat">
                          {study.results.cpa}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-[#666] font-roboto">ROI</p>
                        <p className="text-lg font-bold font-montserrat text-[#4CAF50]">
                          {study.results.roi}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm text-[#666] font-roboto">
                          Target Audience
                        </p>
                        <p className="text-lg font-bold font-montserrat">
                          {study.results.demographics}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-[#666] font-roboto">
                          Engagement
                        </p>
                        <p className="text-lg font-bold font-montserrat">
                          {study.results.engagement}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-l-4 border-[#FF4D4D] pl-4">
                    <p className="italic text-[#666] font-roboto mb-2">
                      "{study.quote}"
                    </p>
                    <p className="text-sm font-bold font-montserrat">
                      - {study.author}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-24 mb-24 p-8 bg-white rounded-xl shadow-lg">
            <h2 className="text-3xl font-bold font-montserrat text-center mb-8">
              Subscriber Growth & Ad Spend Calculator
            </h2>
            <div className="max-w-2xl mx-auto">
              <div className="floating-input-container">
                <input
                  type="number"
                  id="current-subscribers"
                  min="0"
                  value={currentSubscribers}
                  onChange={(e) => setCurrentSubscribers(Number(e.target.value))}
                  className="floating-input"
                  placeholder=" "
                  required
                />
                <label htmlFor="current-subscribers" className="floating-label">Current Subscribers</label>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Subscribers: {targetSubscribers.toLocaleString()}
                </label>
                <input
                  type="range"
                  min="1000"
                  max="1000000"
                  step="1000"
                  value={targetSubscribers}
                  onChange={(e) => setTargetSubscribers(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"
                />
              </div>

              <div className="mb-6">
                <label className="block text-[#666] font-roboto mb-2">
                  Campaign Timeframe (months)
                </label>
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(Number(e.target.value))}
                  className="w-full p-2 border rounded-lg font-roboto"
                >
                  {[1, 2, 3, 4, 5, 6].map((month) => (
                    <option key={month} value={month}>
                      {month} {month === 1 ? "Month" : "Months"}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={calculateBudget}
                className="w-full bg-[#FF4D4D] text-white px-6 py-3 rounded-full font-montserrat hover:bg-[#ff3333] transition-colors"
              >
                Calculate
              </button>

              {calculatedBudget && (
                <div className="mt-8 space-y-6">
                  <div className="p-6 bg-[#f8f8f8] rounded-xl text-center">
                    <h3 className="text-2xl font-bold font-montserrat mb-2">
                      Recommended Monthly Ad Spend
                    </h3>
                    <p className="text-4xl font-bold text-[#FF4D4D] font-montserrat">
                      ${calculatedBudget.toLocaleString()}
                    </p>
                    <p className="text-sm text-[#666] font-roboto mt-4">
                      This estimate is based on industry averages and may vary
                      based on your specific goals and target audience.
                    </p>
                  </div>

                  <div className="p-6 bg-[#f8f8f8] rounded-xl">
                    <h3 className="text-2xl font-bold font-montserrat mb-4 text-center">
                      Estimated Growth Potential
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-[#666] font-roboto">
                          Current
                        </p>
                        <p className="text-2xl font-bold font-montserrat">
                          {currentSubscribers.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-[#666] font-roboto">
                          Potential
                        </p>
                        <p className="text-2xl font-bold text-[#4CAF50] font-montserrat">
                          {targetSubscribers.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-[#4CAF50] h-2.5 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(
                              (currentSubscribers / targetSubscribers) * 100,
                              100
                            )}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                    <p className="text-center text-[#666] font-roboto mt-4">
                      Potential growth of{" "}
                      <span className="text-[#4CAF50] font-bold">
                        {currentSubscribers === 0
                          ? `${targetSubscribers}00`
                          : Math.round(
                              ((targetSubscribers - currentSubscribers) /
                                currentSubscribers) *
                                100
                            )}
                        %
                      </span>{" "}
                      in {timeframe} {timeframe === 1 ? "Month" : "Months"} if
                      you spend ${calculatedBudget.toLocaleString()} per month
                    </p>
                    <p className="text-sm text-[#666] font-roboto mt-4 text-center">
                      This estimate is based on industry averages and may vary
                      based on your specific goals and target audience.
                    </p>
                  </div>

                  <div className="text-center">
                    <button
                      onClick={handleCalendlyClick}
                      className="bg-[#FF4D4D] text-white px-8 py-4 rounded-full text-lg font-montserrat hover:bg-[#ff3333] transition-colors"
                    >
                      Book a Strategy Call to Achieve This Growth
                    </button>
                    <p className="text-sm text-[#666] font-roboto mt-2">
                      Let's discuss how we can help you reach{" "}
                      {targetSubscribers.toLocaleString()} subscribers
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="mt-24 mb-24">
            <h2 className="text-4xl font-bold font-montserrat text-center mb-8">
              Pricing Plans
            </h2>
            <div className="flex justify-center mb-8">
              <div className="bg-gray-100 p-1 rounded-full">
                <button
                  onClick={() => setBillingCycle("monthly")}
                  className={`px-6 py-2 rounded-full ${
                    billingCycle === "monthly"
                      ? "bg-white shadow-md"
                      : "text-gray-600"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle("yearly")}
                  className={`px-6 py-2 rounded-full ${
                    billingCycle === "yearly"
                      ? "bg-white shadow-md"
                      : "text-gray-600"
                  }`}
                >
                  Yearly (20% off)
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {Object.entries(plans).map(([key, plan]) => (
                <div
                  key={key}
                  className={`bg-white rounded-xl shadow-lg p-8 ${
                    selectedPlan === key ? "ring-2 ring-[#FF4D4D]" : ""
                  }`}
                  onClick={() => setSelectedPlan(key)}
                >
                  <h3 className="text-2xl font-bold font-montserrat mb-4">
                    {plan.name}
                  </h3>
                  <div className="mb-6">
                    <span className="text-4xl font-bold font-montserrat">
                      $
                      {billingCycle === "monthly"
                        ? plan.monthlyPrice
                        : plan.yearlyPrice}
                    </span>
                    <span className="text-[#666] font-roboto">/month</span>
                  </div>
                  <div className="mb-6">
                    <p className="text-[#666] font-roboto mb-2">Ad Budget:</p>
                    <p className="font-bold font-montserrat">{plan.adBudget}</p>
                  </div>
                  <div className="mb-6">
                    <p className="text-[#666] font-roboto mb-2">
                      Projected Subscriber Growth:
                    </p>
                    <p className="font-bold font-montserrat">
                      {plan.subscribers}
                    </p>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <i className="fas fa-check-circle text-[#FF4D4D] mt-1 mr-2"></i>
                        <span className="text-[#666] font-roboto">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {billingCycle === "monthly" ? (
                    <button
                      onClick={() => handlePaymentClick(key)}
                      className="w-full bg-[#FF4D4D] text-white px-6 py-3 rounded-full font-montserrat hover:bg-[#ff3333] transition-colors"
                    >
                      Get Started Monthly
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePaymentClick(key + "_yearly")}
                      className="w-full bg-[#FF4D4D] text-white px-6 py-3 rounded-full font-montserrat hover:bg-[#ff3333] transition-colors"
                    >
                      Get Started Yearly
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[#FF4D4D] text-white py-16 mb-16">
            <div className="container mx-auto px-4">
              <h2 className="text-4xl font-bold font-montserrat text-center mb-12">
                Why Book a Call With Us?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                <div className="text-center">
                  <div className="mb-6">
                    <i className="fas fa-chart-line text-4xl"></i>
                  </div>
                  <h3 className="text-2xl font-bold font-montserrat mb-4">
                    Growth Strategy
                  </h3>
                  <p className="font-roboto">
                    Get a personalized plan tailored to your newsletter's unique
                    audience and goals
                  </p>
                </div>
                <div className="text-center">
                  <div className="mb-6">
                    <i className="fas fa-bullseye text-4xl"></i>
                  </div>
                  <h3 className="text-2xl font-bold font-montserrat mb-4">
                    ROI Analysis
                  </h3>
                  <p className="font-roboto">
                    Discover your growth potential and required budget to get
                    subscribers
                  </p>
                </div>
                <div className="text-center">
                  <div className="mb-6">
                    <i className="fas fa-rocket text-4xl"></i>
                  </div>
                  <h3 className="text-2xl font-bold font-montserrat mb-4">
                    Expert Insights
                  </h3>
                  <p className="font-roboto">
                    Learn proven strategies from our team that's helped 100+
                    newsletters scale
                  </p>
                </div>
              </div>
              <div className="text-center mt-12">
                <button
                  onClick={handleCalendlyClick}
                  className="bg-white text-[#FF4D4D] px-8 py-4 rounded-full text-lg font-montserrat hover:bg-gray-100 transition-colors"
                >
                  Book Free Strategy Call
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-24 mb-24">
          <h2 className="text-4xl font-bold font-montserrat text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto px-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="mb-4 border-b border-gray-200 pb-4"
                onClick={() =>
                  setSelectedFaq(selectedFaq === index ? null : index)
                }
              >
                <div className="flex justify-between items-center cursor-pointer">
                  <h3 className="text-lg font-bold font-montserrat text-[#1a1a1a] pr-4">
                    {faq.question}
                  </h3>
                  <i
                    className={`fas ${
                      selectedFaq === index
                        ? "fa-chevron-up"
                        : "fa-chevron-down"
                    } text-[#FF4D4D] transition-transform duration-300 flex-shrink-0`}
                  ></i>
                </div>
                {selectedFaq === index && (
                  <p className="mt-4 text-[#666] font-roboto text-sm md:text-base">
                    {faq.answer}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#f8f8f8] py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl font-bold font-montserrat mb-8">
                About Socialitix
              </h2>
              <p className="text-lg text-[#666] font-roboto mb-6">
                Socialitix is the leading newsletter growth agency specializing
                in social media advertising. Our team of experts has helped over
                100+ newsletters scale their subscriber base through targeted
                Twitter and TikTok campaigns.
              </p>
              <p className="text-lg text-[#666] font-roboto mb-6">
                We combine data-driven strategies with creative excellence to
                deliver exceptional results for our clients. Our proven
                methodology has generated over 1.5M+ new subscribers across
                various newsletters.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                <div className="text-center">
                  <i className="fas fa-users text-4xl text-[#FF4D4D] mb-4"></i>
                  <h3 className="text-xl font-bold font-montserrat mb-2">
                    Expert Team
                  </h3>
                  <p className="text-[#666] font-roboto">
                    Dedicated specialists in newsletter growth and social media
                    advertising
                  </p>
                </div>
                <div className="text-center">
                  <i className="fas fa-chart-bar text-4xl text-[#FF4D4D] mb-4"></i>
                  <h3 className="text-xl font-bold font-montserrat mb-2">
                    Data-Driven
                  </h3>
                  <p className="text-[#666] font-roboto">
                    Results-focused approach with transparent reporting and
                    optimization
                  </p>
                </div>
                <div className="text-center">
                  <i className="fas fa-trophy text-4xl text-[#FF4D4D] mb-4"></i>
                  <h3 className="text-xl font-bold font-montserrat mb-2">
                    Proven Results
                  </h3>
                  <p className="text-[#666] font-roboto">
                    Consistent success across diverse newsletter niches and
                    audiences
                  </p>
                </div>
              </div>
              <div className="mt-12 text-center">
                <p className="text-lg text-[#666] font-roboto mb-6">
                  Ready to transform your newsletter growth?
                </p>
                <button
                  onClick={handleCalendlyClick}
                  className="bg-[#FF4D4D] text-white px-8 py-4 rounded-full text-lg font-montserrat hover:bg-[#ff3333] transition-colors"
                >
                  Start Growing Your Newsletter
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold font-montserrat mb-8 text-center">
                Privacy Policy
              </h2>
              <div className="prose font-roboto text-[#666]">
                <p className="mb-4">Last updated: January 2024</p>
                <p className="mb-4">
                  At Socialitix, we take your privacy seriously. This policy
                  outlines how we collect, use, and protect your personal
                  information when you use our services.
                </p>
                <p className="mb-4">
                  We collect basic information such as your name, email, and
                  newsletter details solely for the purpose of providing our
                  growth services. Your data is never sold to third parties.
                </p>
                <p className="mb-4">
                  For questions about our privacy practices, please email
                  support@socialitix.com.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-[#f8f8f8] py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold font-montserrat mb-8 text-center">
                  Terms of Service
                </h2>
                <div className="prose font-roboto text-[#666]">
                  <p className="mb-4">Last updated: January 2024</p>
                  <p className="mb-4">
                    By using Socialitix services, you agree to these terms. Our
                    services are provided "as is" without warranties of any
                    kind.
                  </p>
                  <p className="mb-4">
                    We reserve the right to modify or terminate services for any
                    reason, without notice at any time.
                  </p>
                  <p className="mb-4">
                    Your use of our services must comply with all applicable
                    laws and regulations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold font-montserrat mb-8 text-center">
                Refund Policy
              </h2>
              <div className="prose font-roboto text-[#666]">
                <p className="mb-4">Last updated: January 2024</p>
                <p className="mb-4">
                  At Socialitix, we aim to provide a seamless experience.
                  However, if you're not satisfied with our services, refunds
                  are available under the following terms:
                </p>
                <h3 className="text-xl font-bold font-montserrat mb-4">
                  Eligibility
                </h3>
                <ul className="list-disc pl-6 mb-4">
                  <li>
                    Refund requests must be made within 30 days of purchase
                  </li>
                  <li>
                    Requests will be reviewed to determine eligibility based on
                    the nature of the issue
                  </li>
                </ul>
                <h3 className="text-xl font-bold font-montserrat mb-4">
                  Refund Options
                </h3>
                <p className="mb-2">If approved, you may choose:</p>
                <ol className="list-decimal pl-6 mb-4">
                  <li>
                    Biweekly Installments: Refund issued in equal biweekly
                    payments
                  </li>
                  <li>
                    45-Day Refund: Full refund provided in a single payment
                    after a 45-day wait
                  </li>
                </ol>
                <h3 className="text-xl font-bold font-montserrat mb-4">
                  How to Request
                </h3>
                <p className="mb-4">
                  Submit your request via support@socialitix.com
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-[#1a1a1a] text-white py-4 text-center">
        <p className="text-sm font-roboto">
          © 2024 Socialitix® All rights reserved.
        </p>
      </footer>

      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl max-w-md w-full mx-4 relative animate-[slideIn_0.3s_ease-out]">
            <button
              onClick={() => setShowPopup(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <i className="fas fa-times text-xl"></i>
            </button>

            {!showThankYou ? (
              <>
                <h2 className="text-2xl font-bold font-montserrat mb-4">
                  Download Your Free Guide
                </h2>
                <p className="text-[#666] mb-6 font-roboto">
                  Enter your email to receive "{selectedGuide?.title}"
                </p>
                <form onSubmit={handleSubmit}>
                  <input
                    type="email"
                    name="email"
                    placeholder="Your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 border rounded-lg mb-4 font-roboto"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full bg-[#FF4D4D] text-white px-6 py-3 rounded-full font-montserrat hover:bg-[#ff3333] transition-colors"
                  >
                    Get My Free Guide
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-8">
                <i className="fas fa-check-circle text-[#4CAF50] text-5xl mb-4"></i>
                <h3 className="text-xl font-bold font-montserrat mb-2">
                  Thank You!
                </h3>
                <p className="text-[#666] font-roboto">
                  Your download will begin shortly...
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slideIn {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

export default MainComponent;