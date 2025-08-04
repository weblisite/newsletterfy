"use client";
import React from "react";
import { useSession } from '@/lib/auth-client';

function MainComponent() {
  const [currentView, setCurrentView] = React.useState("landing");
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [activeMonetizationTab, setActiveMonetizationTab] =
    React.useState("sponsored");
  const [showAnalytics, setShowAnalytics] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const fonts = ["Arial", "Times New Roman", "Helvetica", "Verdana", "Georgia"];
  const colorSchemes = [
    { name: "Default", primary: "#000000", secondary: "#ffffff" },
    { name: "Dark", primary: "#1a1a1a", secondary: "#f5f5f5" },
    { name: "Light", primary: "#ffffff", secondary: "#1a1a1a" },
  ];
  const staticNewsletters = [
    {
      id: 1,
      name: "Tech Insider",
      subscribers: 50000,
      category: "Technology",
      price: 100,
    },
    {
      id: 2,
      name: "Finance Weekly",
      subscribers: 75000,
      category: "Finance",
      price: 150,
    },
    {
      id: 3,
      name: "Health & Wellness",
      subscribers: 30000,
      category: "Health",
      price: 80,
    },
  ];
  const filteredNewsletters = staticNewsletters.filter(
    (newsletter) =>
      newsletter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      newsletter.category.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [newsletters, setNewsletters] = React.useState([]);
  const [users, setUsers] = React.useState([
    {
      id: 1,
      name: "Jack Andrews",
      email: "john@example.com",
      role: "User",
      status: "Active",
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane@example.com",
      role: "Admin",
      status: "Active",
    },
    {
      id: 3,
      name: "Bob Johnson",
      email: "bob@example.com",
      role: "User",
      status: "Suspended",
    },
  ]);
  const handleStatusChange = (id, newStatus) => {
    setUsers(
      users.map((user) =>
        user.id === id ? { ...user, status: newStatus } : user
      )
    );
  };
  const handleRoleChange = (id, newRole) => {
    setUsers(
      users.map((user) => (user.id === id ? { ...user, role: newRole } : user))
    );
  };
  const loadNewsletters = async () => {
    try {
      const response = await fetch("/api/newsletters", {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
      });
      if (!response.ok) throw new Error("Failed to load newsletters");
      const data = await response.json();
      setNewsletters(data);
    } catch (error) {
      console.error("Error loading newsletters:", error);
    }
  };
  const handleSave = async () => {
    if (!title || !content) return;
    setLoading(true);
    try {
      const response = await fetch("/api/newsletters", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
        body: JSON.stringify({ title, content }),
      });
      if (!response.ok) throw new Error("Failed to create newsletter");
      setTitle("");
      setContent("");
      loadNewsletters();
    } catch (error) {
      console.error("Error creating newsletter:", error);
    }
    setLoading(false);
  };
  const [selectedBusinessTier, setSelectedBusinessTier] = React.useState({
    subscribers: 1000,
    price: 89,
  });
  const [selectedProTier, setSelectedProTier] = React.useState({
    subscribers: 1000,
    price: 29,
  });

  const businessTiers = [
    { subscribers: 1000, price: 89 },
    { subscribers: 5000, price: 129 },
    { subscribers: 10000, price: 149 },
    { subscribers: 25000, price: 199 },
    { subscribers: 50000, price: 249 },
    { subscribers: 75000, price: 279 },
    { subscribers: 100000, price: 299 },
  ];
  const proTiers = [
    { subscribers: 1000, price: 29 },
    { subscribers: 5000, price: 49 },
    { subscribers: 10000, price: 69 },
    { subscribers: 25000, price: 119 },
    { subscribers: 50000, price: 149 },
    { subscribers: 75000, price: 199 },
    { subscribers: 100000, price: 249 },
  ];
  const handleBusinessTierChange = (event) => {
    const tier = businessTiers.find(
      (t) => t.subscribers === parseInt(event.target.value)
    );
    setSelectedBusinessTier(tier);
  };
  const handleProTierChange = (event) => {
    const tier = proTiers.find(
      (t) => t.subscribers === parseInt(event.target.value)
    );
    setSelectedProTier(tier);
  };



  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.offsetTop;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: "smooth",
      });
    }
  };

  const handleGetStarted = () => {
    scrollToSection("pricing");
  };
  // "Account First" flow - Always create account first, then payment (no trials)
  const checkAuthAndProceed = async (planData) => {
    try {
      // Always redirect to signup first with plan information
      const planParams = new URLSearchParams({
        plan: planData.type,
        tier: planData.subscribers.toString()
      });
      
      // Add price for paid plans (not needed for Free)
      if (planData.type !== 'Free') {
        planParams.set('price', planData.price.toString());
      }
      
      window.location.href = `/auth/signup?${planParams.toString()}`;
    } catch (error) {
      console.error('Plan selection error:', error);
      alert('There was an error processing your request. Please try again.');
    }
  };

  const handleProPlanClick = () => {
    const planData = {
      type: 'Pro',
      subscribers: selectedProTier.subscribers,
      price: selectedProTier.price
    };
    checkAuthAndProceed(planData);
  };

  const handleBusinessPlanClick = () => {
    const planData = {
      type: 'Business', 
      subscribers: selectedBusinessTier.subscribers,
      price: selectedBusinessTier.price
    };
    checkAuthAndProceed(planData);
  };

  const handleFreePlanClick = () => {
    const planData = {
      type: 'Free',
      subscribers: 1000, // Default for free plan
      price: 0
    };
    checkAuthAndProceed(planData);
  };
  const [ads, setAds] = React.useState([]);
  const [newAd, setNewAd] = React.useState({
    company: "",
    adCopy: "",
    targetUrl: "",
    paymentType: "CPM",
    amount: 0,
    postDate: "",
    status: "pending",
  });
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAd({ ...newAd, [name]: value });
  };
  const handleAddAd = () => {
    if (
      !newAd.company ||
      !newAd.adCopy ||
      !newAd.targetUrl ||
      !newAd.amount ||
      !newAd.postDate
    ) {
      alert("Please fill in all fields");
      return;
    }
    setAds([...ads, { ...newAd, id: Date.now() }]);
    setNewAd({
      company: "",
      adCopy: "",
      targetUrl: "",
      paymentType: "CPM",
      amount: 0,
      postDate: "",
      status: "pending",
    });
  };
  const [selectedNewsletter, setSelectedNewsletter] = React.useState("");
  const [distributedAds, setDistributedAds] = React.useState([]);
  const handleDistributeAd = (ad) => {
    if (!selectedNewsletter) {
      alert("Please select a newsletter first");
      return;
    }

    if (
      distributedAds.some(
        (dAd) => dAd.id === ad.id && dAd.newsletter === selectedNewsletter
      )
    ) {
      alert("This ad is already distributed to this newsletter");
      return;
    }

    const updatedAd = {
      ...ad,
      newsletter: selectedNewsletter,
      status: "active",
      distributedDate: new Date().toISOString(),
    };
    setDistributedAds([...distributedAds, updatedAd]);
    setAds(ads.map((a) => (a.id === ad.id ? { ...a, status: "active" } : a)));
    alert(
      `Ad from ${ad.company} successfully distributed to ${selectedNewsletter}`
    );
  };
  const handleDirectoryClick = () => {
    window.location.href = "/newsletterfy-directory";
  };
  const handleMarketplaceClick = () => {
    window.location.href = "/newsletterfy-marketplace";
  };

  const handleTermsClick = () => {
    window.location.href = "/terms-of-service";
  };

  const handlePrivacyClick = () => {
    window.location.href = "/privacy-policy";
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <i className="fas fa-envelope-open-text text-2xl text-cyan-500 mr-2"></i>
              <span className="text-xl font-bold text-cyan-500">
                Newsletterfy
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => scrollToSection("features")}
                className="text-gray-600 hover:text-cyan-500"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection("pricing")}
                className="text-gray-600 hover:text-cyan-500"
              >
                Pricing
              </button>
              <button
                onClick={handleDirectoryClick}
                className="text-gray-600 hover:text-cyan-500"
              >
                Directory
              </button>
              <button
                onClick={handleMarketplaceClick}
                className="text-gray-600 hover:text-cyan-500"
              >
                Marketplace
              </button>
              <button
                onClick={() => scrollToSection("pricing")}
                className="bg-cyan-500 text-white px-4 py-2 rounded-lg hover:bg-cyan-600"
              >
                Get Started
              </button>
            </div>
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-600 hover:text-cyan-500"
              >
                <i
                  className={`fas ${
                    mobileMenuOpen ? "fa-times" : "fa-bars"
                  } text-xl`}
                ></i>
              </button>
            </div>
          </div>
          {mobileMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                <button
                  onClick={() => {
                    scrollToSection("features");
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-gray-600 hover:text-cyan-500"
                >
                  Features
                </button>
                <button
                  onClick={() => {
                    scrollToSection("pricing");
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-gray-600 hover:text-cyan-500"
                >
                  Pricing
                </button>
                <button
                  onClick={() => {
                    handleDirectoryClick();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-gray-600 hover:text-cyan-500"
                >
                  Directory
                </button>
                <button
                  onClick={() => {
                    handleMarketplaceClick();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-gray-600 hover:text-cyan-500"
                >
                  Marketplace
                </button>
                <button
                  onClick={() => {
                    scrollToSection("pricing");
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600"
                >
                  Get Started
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>
      <div className="pt-16">
        <div className="bg-gradient-to-b from-cyan-900 to-cyan-700">
          <section className="relative overflow-hidden">
            <div className="container mx-auto px-4 py-16">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="md:w-1/2 mb-10 md:mb-0">
                  <span className="text-cyan-300 text-lg font-semibold mb-2 inline-block">
                    Welcome to the Future of Newsletters
                  </span>
                  <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white leading-tight">
                    Create. Engage. <br />
                    <span className="text-cyan-300">Monetize.</span>
                  </h1>
                  <p className="text-xl mb-8 text-cyan-100 leading-relaxed">
                    The all-in-one platform for creating stunning newsletters,
                    growing your audience, and generating revenue. Create your
                    newsletter below to join other successful newsletters.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={handleGetStarted}
                      className="bg-white text-cyan-900 px-8 py-4 rounded-full font-semibold text-lg hover:bg-cyan-100 transition duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    >
                      Get Started
                    </button>
                    <button
                      onClick={handleGetStarted}
                      className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white hover:text-cyan-900 transition duration-300"
                    >
                      Watch Demo
                    </button>
                  </div>
                  <div className="mt-8 flex items-center space-x-4 text-cyan-100">
                    <div className="flex -space-x-2">
                      <img
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop"
                        className="w-8 h-8 rounded-full border-2 border-cyan-900"
                        alt="User avatar"
                      />
                      <img
                        src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop"
                        className="w-8 h-8 rounded-full border-2 border-cyan-900"
                        alt="User avatar"
                      />
                      <img
                        src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop"
                        className="w-8 h-8 rounded-full border-2 border-cyan-900"
                        alt="User avatar"
                      />
                    </div>
                    <span>Join 10+ newsletter creators</span>
                  </div>
                </div>
                <div className="md:w-1/2 relative">
                  <div className="absolute -top-20 -right-20 w-64 h-64 bg-cyan-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                  <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-cyan-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
                  <div className="relative">
                    <img
                      src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop"
                      alt="Newsletter dashboard showing analytics and subscriber growth"
                      className="rounded-2xl shadow-2xl border-4 border-cyan-800"
                    />
                    <div className="absolute -bottom-10 left-0 bg-white p-4 rounded-xl shadow-xl">
                      <div className="flex items-center space-x-2">
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                          <i className="fas fa-arrow-up text-white text-xl"></i>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">
                            Subscriber Growth
                          </p>
                          <p className="text-lg font-bold text-gray-900">
                            +127%
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="absolute -top-10 right-0 bg-white p-4 rounded-xl shadow-xl">
                      <div className="flex items-center space-x-2">
                        <div className="w-12 h-12 bg-cyan-500 rounded-full flex items-center justify-center">
                          <i className="fas fa-dollar-sign text-white text-xl"></i>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">
                            Revenue Growth
                          </p>
                          <p className="text-lg font-bold text-gray-900">
                            +$420
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          <section id="features" className="bg-white py-12 relative">
            <div className="container mx-auto px-4">
              <h2 className="text-4xl font-bold text-center mb-12">
                How It Works
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <div className="text-3xl mb-4 bg-cyan-500 text-white w-10 h-10 flex items-center justify-center rounded-full">1</div>
                  <h3 className="text-xl font-bold mb-2">Sign Up</h3>
                  <p className="text-gray-600">
                    Create your free Newsletterfy account in 60 seconds
                  </p>
                </div>
                <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <div className="text-3xl mb-4 bg-cyan-500 text-white w-10 h-10 flex items-center justify-center rounded-full">2</div>
                  <h3 className="text-xl font-bold mb-2">Create</h3>
                  <p className="text-gray-600">
                    Design your newsletter with our intuitive editor
                  </p>
                </div>
                <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <div className="text-3xl mb-4 bg-cyan-500 text-white w-10 h-10 flex items-center justify-center rounded-full">3</div>
                  <h3 className="text-xl font-bold mb-2">Launch</h3>
                  <p className="text-gray-600">
                    Start monetizing your audience and growing your business
                  </p>
                </div>
              </div>
              <h2 className="text-4xl font-bold text-center mb-12">
                Perfect for Every Creator
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <div className="text-3xl mb-4">👩‍💻</div>
                  <h3 className="text-xl font-bold mb-2">Bloggers</h3>
                  <p className="text-gray-600">
                    Turn your blog audience into newsletter subscribers.
                    Monetize through premium content, digital products, and
                    sponsored partnerships.
                  </p>
                </div>
                <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <div className="text-3xl mb-4">🏢</div>
                  <h3 className="text-xl font-bold mb-2">Businesses</h3>
                  <p className="text-gray-600">
                    Keep customers engaged with professional newsletters. Drive
                    sales through targeted campaigns and exclusive offers.
                  </p>
                </div>
                <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <div className="text-3xl mb-4">👩‍🏫</div>
                  <h3 className="text-xl font-bold mb-2">Educators</h3>
                  <p className="text-gray-600">
                    Share knowledge through structured newsletter courses.
                    Create premium educational content and digital learning
                    materials.
                  </p>
                </div>
                <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <div className="text-3xl mb-4">🛍️</div>
                  <h3 className="text-xl font-bold mb-2">E-commerce Brands</h3>
                  <p className="text-gray-600">
                    Boost sales with engaging product newsletters. Build
                    customer loyalty through exclusive deals and early access
                    offers.
                  </p>
                </div>
                <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <div className="text-3xl mb-4">🎨</div>
                  <h3 className="text-xl font-bold mb-2">Artists & Creators</h3>
                  <p className="text-gray-600">
                    Share your creative journey and sell your artwork. Build a
                    community around your creative process and exclusive
                    content.
                  </p>
                </div>
                <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <div className="text-3xl mb-4">🎯</div>
                  <h3 className="text-xl font-bold mb-2">Marketers</h3>
                  <p className="text-gray-600">
                    Deliver targeted content to segmented audiences. Track
                    engagement and optimize your marketing campaigns
                    effectively.
                  </p>
                </div>
              </div>
              <section className="bg-cyan-600 text-white py-20 mb-16">
                <div className="container mx-auto px-4 text-center">
                  <h2 className="text-3xl font-bold mb-4">
                    Transform Your Newsletter Today
                  </h2>
                  <p className="text-xl mb-8">
                    Join the community of successful newsletter creators and
                    start monetizing your content
                  </p>
                  <button
                    onClick={() => scrollToSection("pricing")}
                    className="bg-white text-cyan-600 px-8 py-3 rounded-full font-semibold text-lg hover:bg-cyan-100 transition duration-300"
                  >
                    Get Started
                  </button>
                </div>
              </section>
              <h2 className="text-4xl font-bold text-center mb-4">
                Everything You Need to Succeed
              </h2>
              <p className="text-xl text-gray-600 text-center mb-8 max-w-3xl mx-auto">
                Powerful tools and features designed to help you create, grow,
                and monetize your newsletter with ease.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="bg-white p-6 rounded-lg shadow-md text-center">
                  <div className="flex justify-center mb-4">
                    <i className="fas fa-envelope text-cyan-500 text-4xl"></i>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Easy Creation</h3>
                  <p className="text-gray-600">
                    Intuitive editor for crafting beautiful newsletters
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md text-center">
                  <div className="flex justify-center mb-4">
                    <i className="fas fa-users text-green-500 text-4xl"></i>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    Audience Management
                  </h3>
                  <p className="text-gray-600">
                    Powerful tools to grow and engage your subscriber base
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md text-center">
                  <div className="flex justify-center mb-4">
                    <i className="fas fa-chart-bar text-purple-500 text-4xl"></i>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    Insightful Analytics
                  </h3>
                  <p className="text-gray-600">
                    Track performance and optimize your content
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md text-center">
                  <div className="flex justify-center mb-4">
                    <i className="fas fa-dollar-sign text-yellow-500 text-4xl"></i>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Monetization</h3>
                  <p className="text-gray-600">
                    Turn your passion into profit with built-in monetization
                    tools
                  </p>
                </div>
              </div>
            </div>
          </section>
          <section className="bg-white py-12">
            <div className="container mx-auto px-4">
              <h2 className="text-4xl font-bold text-center mb-12">
                Monetize Your Newsletter
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-all">
                  <div className="flex items-center mb-6">
                    <div className="bg-cyan-100 p-3 rounded-lg">
                      <i className="fas fa-ad text-cyan-600 text-2xl"></i>
                    </div>
                    <h3 className="text-xl font-bold ml-4">Sponsored Ads</h3>
                  </div>
                  <p className="text-gray-600 mb-4">
                    Partner with brands and monetize your newsletter via
                    sponsored ads.
                  </p>
                  <div className="border-t pt-4">
                    <div className="flex items-center text-green-600 mb-2">
                      <i className="fas fa-check-circle mr-2"></i>
                      <span>Average earnings: $500/post</span>
                    </div>
                    <div className="flex items-center text-green-600">
                      <i className="fas fa-check-circle mr-2"></i>
                      <span>12 active sponsors</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-all">
                  <div className="flex items-center mb-6">
                    <div className="bg-red-100 p-3 rounded-lg">
                      <i className="fas fa-sync text-red-600 text-2xl"></i>
                    </div>
                    <h3 className="text-xl font-bold ml-4">Cross-Promotions</h3>
                  </div>
                  <p className="text-gray-600 mb-4">
                    Promote other newsletters in your subscription flow and earn
                    revenue.
                  </p>
                  <div className="border-t pt-4">
                    <div className="flex items-center text-green-600 mb-2">
                      <i className="fas fa-check-circle mr-2"></i>
                      <span>380 subscribers generated</span>
                    </div>
                    <div className="flex items-center text-green-600">
                      <i className="fas fa-check-circle mr-2"></i>
                      <span>$570 earned on cross promotions</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-all">
                  <div className="flex items-center mb-6">
                    <div className="bg-yellow-100 p-3 rounded-lg">
                      <i className="fas fa-credit-card text-yellow-600 text-2xl"></i>
                    </div>
                    <h3 className="text-xl font-bold ml-4">
                      Paid Subscriptions
                    </h3>
                  </div>
                  <p className="text-gray-600 mb-4">
                    Offer premium content through paid subscriptions and earn
                    recurringly.
                  </p>
                  <div className="border-t pt-4">
                    <div className="flex items-center text-green-600 mb-2">
                      <i className="fas fa-check-circle mr-2"></i>
                      <span>1,234 subscribers</span>
                    </div>
                    <div className="flex items-center text-green-600">
                      <i className="fas fa-check-circle mr-2"></i>
                      <span>$6,170 monthly revenue</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-all">
                  <div className="flex items-center mb-6">
                    <div className="bg-pink-100 p-3 rounded-lg">
                      <i className="fas fa-gift text-pink-600 text-2xl"></i>
                    </div>
                    <h3 className="text-xl font-bold ml-4">Tips & Donations</h3>
                  </div>
                  <p className="text-gray-600 mb-4">
                    Accept tips and donations from your supportive readers.
                  </p>
                  <div className="border-t pt-4">
                    <div className="flex items-center text-green-600 mb-2">
                      <i className="fas fa-check-circle mr-2"></i>
                      <span>156 supporters</span>
                    </div>
                    <div className="flex items-center text-green-600">
                      <i className="fas fa-check-circle mr-2"></i>
                      <span>$890 total tips</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-all">
                  <div className="flex items-center mb-6">
                    <div className="bg-purple-100 p-3 rounded-lg">
                      <i className="fas fa-shopping-cart text-purple-600 text-2xl"></i>
                    </div>
                    <h3 className="text-xl font-bold ml-4">Digital Products</h3>
                  </div>
                  <p className="text-gray-600 mb-4">
                    Sell courses, eBooks, and digital products and earn sales
                    revenue.
                  </p>
                  <div className="border-t pt-4">
                    <div className="flex items-center text-green-600 mb-2">
                      <i className="fas fa-check-circle mr-2"></i>
                      <span>245 products sold</span>
                    </div>
                    <div className="flex items-center text-green-600">
                      <i className="fas fa-check-circle mr-2"></i>
                      <span>$4,200 sales revenue</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-all">
                  <div className="flex items-center mb-6">
                    <div className="bg-green-100 p-3 rounded-lg">
                      <i className="fas fa-share-alt text-green-600 text-2xl"></i>
                    </div>
                    <h3 className="text-xl font-bold ml-4">
                      Affiliate Program
                    </h3>
                  </div>
                  <p className="text-gray-600 mb-4">
                    Earn 50% commission by promoting Newsletterfy to your
                    audience.
                  </p>
                  <div className="border-t pt-4">
                    <div className="flex items-center text-green-600 mb-2">
                      <i className="fas fa-check-circle mr-2"></i>
                      <span>56 referrals</span>
                    </div>
                    <div className="flex items-center text-green-600">
                      <i className="fas fa-check-circle mr-2"></i>
                      <span>$1,624 affiliate revenue</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          <section className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white py-16">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Start Monetizing Your Newsletter Today
              </h2>
              <p className="text-xl mb-8 max-w-2xl mx-auto">
                Join successful creators who are already earning through their
                newsletters. Our platform provides all the tools you need to
                start generating revenue.
              </p>
              <div className="flex flex-col md:flex-row justify-center items-center gap-4">
                <button
                  onClick={() => scrollToSection("pricing")}
                  className="bg-white text-cyan-500 px-8 py-4 rounded-full font-semibold text-lg hover:bg-cyan-50 transition duration-300 shadow-lg"
                >
                  Get Started
                </button>
              </div>
            </div>
          </section>
          <section id="testimonials" className="bg-gray-50 py-24 relative">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-12">
                What Our Users Say
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <p className="text-gray-600 mb-4">
                    "Newsletterfy has transformed the way I connect with my
                    audience. It's so easy to use!"
                  </p>
                  <div className="font-semibold">Jack Andrews</div>
                  <div className="text-sm text-gray-500">Tech Blogger</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <p className="text-gray-600 mb-4">
                    "The analytics feature is a game-changer. I can now tailor
                    my content to what my subscribers want."
                  </p>
                  <div className="font-semibold">Bobby Smith</div>
                  <div className="text-sm text-gray-500">
                    Marketing Consultant
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <p className="text-gray-600 mb-4">
                    "I never thought monetizing my newsletter could be this
                    simple. Thank you, Newsletterfy!"
                  </p>
                  <div className="font-semibold">Emily Brown</div>
                  <div className="text-sm text-gray-500">
                    Fitness Instructor
                  </div>
                </div>
              </div>
            </div>
          </section>
          <section id="pricing" className="bg-gray-100 py-16">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-[#1f2937] mb-4">
                Pricing Plans
              </h2>
              <p className="text-xl text-[#4b5563]">
                Choose the plan that's right for you
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
              <div className="bg-[#f9fafb] p-6 rounded-lg shadow-lg flex flex-col justify-between h-full border-2 border-[#e5e7eb]">
                <div>
                  <h3 className="text-2xl font-bold mb-2 text-[#1f2937]">
                    Free
                  </h3>
                  <p className="text-4xl font-bold mb-4 text-[#1f2937]">
                    $0<span className="text-lg">/month</span>
                  </p>
                  <ul className="text-left space-y-2 mb-6">
                    <li>
                      <i className="fas fa-check text-[#16a34a] mr-2"></i>Up to
                      1,000 Subscribers
                    </li>
                    <li>
                      <i className="fas fa-check text-[#16a34a] mr-2"></i>Send
                      5,000 Emails/Month
                    </li>
                    <li>
                      <i className="fas fa-check text-[#16a34a] mr-2"></i>1
                      Newsletter
                    </li>
                    <li>
                      <i className="fas fa-check text-[#16a34a] mr-2"></i>
                      Basic Editor
                    </li>
                    <li>
                      <i className="fas fa-check text-[#16a34a] mr-2"></i>
                      Basic Templates
                    </li>
                    <li>
                      <i className="fas fa-check text-[#16a34a] mr-2"></i>
                      Basic Analytics
                    </li>
                    <li>
                      <i className="fas fa-check text-[#16a34a] mr-2"></i>
                      Email Support
                    </li>
                    <li>
                      <i className="fas fa-check text-[#16a34a] mr-2"></i>Tips
                      and Donations
                    </li>
                    <li>
                      <i className="fas fa-check text-[#16a34a] mr-2"></i>
                      Affiliate Program
                    </li>
                  </ul>
                </div>
                <button 
                  onClick={handleFreePlanClick}
                  className="w-full bg-[#06b6d4] text-[#ffffff] px-4 py-2 rounded hover:bg-[#0891b2] transition duration-300"
                >
                  Choose Free
                </button>
              </div>
              <div className="bg-[#f9fafb] p-6 rounded-lg shadow-lg border-2 border-[#e5e7eb] flex flex-col justify-between h-full">
                <div>
                  <h3 className="text-2xl font-bold mb-2 text-[#1f2937]">
                    Pro
                  </h3>
                  <select
                    value={selectedProTier.subscribers}
                    onChange={handleProTierChange}
                    className="w-full p-2 border rounded mb-4"
                  >
                    {proTiers.map((tier) => (
                      <option key={tier.subscribers} value={tier.subscribers}>
                        {tier.subscribers.toLocaleString()} subscribers - $
                        {tier.price}
                        /month
                      </option>
                    ))}
                  </select>
                  <p className="text-4xl font-bold mb-4 text-[#1f2937]">
                    ${selectedProTier.price}
                    <span className="text-lg">/month</span>
                  </p>
                  <ul className="text-left space-y-2 mb-6">
                    <li>
                      <i className="fas fa-check text-[#16a34a] mr-2"></i>
                      {selectedProTier.subscribers.toLocaleString()} Subscribers
                    </li>
                    <li>
                      <i className="fas fa-check text-[#16a34a] mr-2"></i>
                      Unlimited Emails
                    </li>
                    <li>
                      <i className="fas fa-check text-[#16a34a] mr-2"></i>5
                      Newsletters
                    </li>
                    <li>
                      <i className="fas fa-check text-[#16a34a] mr-2"></i>
                      Advanced Editor
                    </li>
                    <li>
                      <i className="fas fa-check text-[#16a34a] mr-2"></i>
                      Premium Templates
                    </li>
                    <li>
                      <i className="fas fa-check text-[#16a34a] mr-2"></i>
                      Advanced Analytics
                    </li>
                    <li>
                      <i className="fas fa-check text-[#16a34a] mr-2"></i>
                      Priority Email Support
                    </li>
                    <li>
                      <i className="fas fa-check text-[#16a34a] mr-2"></i>
                      Everything in Free
                    </li>
                    <li>
                      <i className="fas fa-check text-[#16a34a] mr-2"></i>Paid
                      Subscriptions
                    </li>
                    <li>
                      <i className="fas fa-check text-[#16a34a] mr-2"></i>
                      Digital Products
                    </li>
                    <li>
                      <i className="fas fa-check text-[#16a34a] mr-2"></i>
                      Cross Promotions
                    </li>
                    <li>
                      <i className="fas fa-check text-[#16a34a] mr-2"></i>
                      Sponsored Ads
                    </li>
                    <li>
                      <i className="fas fa-check text-[#16a34a] mr-2"></i>A/B
                      Testing
                    </li>
                    <li>
                      <i className="fas fa-check text-[#16a34a] mr-2"></i>
                      Custom Branding
                    </li>
                  </ul>
                </div>
                <button
                  onClick={handleProPlanClick}
                  className="w-full bg-[#06b6d4] text-[#ffffff] px-4 py-2 rounded hover:bg-[#0891b2] transition duration-300"
                >
                  Choose Pro
                </button>
              </div>
              <div className="bg-[#f9fafb] p-6 rounded-lg shadow-lg flex flex-col justify-between h-full border-2 border-[#e5e7eb]">
                <div>
                  <h3 className="text-2xl font-bold mb-2 text-[#1f2937]">
                    Business
                  </h3>
                  <select
                    value={selectedBusinessTier.subscribers}
                    onChange={handleBusinessTierChange}
                    className="w-full p-2 border rounded mb-4"
                  >
                    {businessTiers.map((tier) => (
                      <option key={tier.subscribers} value={tier.subscribers}>
                        {tier.subscribers.toLocaleString()} subscribers - $
                        {tier.price}
                        /month
                      </option>
                    ))}
                  </select>
                  <p className="text-4xl font-bold mb-4 text-[#1f2937]">
                    ${selectedBusinessTier.price}
                    <span className="text-lg">/month</span>
                  </p>
                  <ul className="text-left space-y-2 mb-6">
                    <li>
                      <i className="fas fa-check text-[#16a34a] mr-2"></i>
                      {selectedBusinessTier.subscribers.toLocaleString()}{" "}
                      Subscribers
                    </li>
                    <li>
                      <i className="fas fa-check text-[#16a34a] mr-2"></i>
                      Everything in Pro
                    </li>
                    <li>
                      <i className="fas fa-check text-[#16a34a] mr-2"></i>
                      Custom Domain
                    </li>
                    <li>
                      <i className="fas fa-check text-[#16a34a] mr-2"></i>15
                      Newsletters
                    </li>
                    <li>
                      <i className="fas fa-check text-[#16a34a] mr-2"></i>
                      Priority Support
                    </li>
                    <li>
                      <i className="fas fa-check text-[#16a34a] mr-2"></i>
                      Dedicated Account Manager
                    </li>
                    <li>
                      <i className="fas fa-check text-[#16a34a] mr-2"></i>
                      Everything in Pro
                    </li>
                    <li>
                      <i className="fas fa-check text-[#16a34a] mr-2"></i>
                      Custom Payment Gateway
                    </li>
                    <li>
                      <i className="fas fa-check text-[#16a34a] mr-2"></i>
                      Premium Ad Network
                    </li>
                    <li>
                      <i className="fas fa-check text-[#16a34a] mr-2"></i>
                      Advanced Sponsorship Tools
                    </li>
                    <li>
                      <i className="fas fa-check text-[#16a34a] mr-2"></i>API
                      Access
                    </li>
                    <li>
                      <i className="fas fa-check text-[#16a34a] mr-2"></i>
                      Advanced Segmentation
                    </li>
                    <li>
                      <i className="fas fa-check text-[#16a34a] mr-2"></i>
                      Custom Integrations
                    </li>
                    <li>
                      <i className="fas fa-check text-[#16a34a] mr-2"></i>SSO
                      Authentication
                    </li>
                  </ul>
                </div>
                <button
                  onClick={handleBusinessPlanClick}
                  className="w-full bg-[#06b6d4] text-[#ffffff] px-4 py-2 rounded hover:bg-[#0891b2] transition duration-300"
                >
                  Choose Business
                </button>
              </div>
              <div className="bg-[#f9fafb] p-6 rounded-lg shadow-lg flex flex-col justify-between h-full border-2 border-[#e5e7eb]">
                <div>
                  <h3 className="text-2xl font-bold mb-2 text-[#1f2937]">
                    Enterprise
                  </h3>
                  <div className="mb-4">
                    <p className="text-2xl font-bold text-[#1f2937]">Custom Pricing</p>
                    <p className="text-sm text-[#6b7280]">Contact our sales team</p>
                  </div>
                  <ul className="text-left space-y-2 mb-6">
                    <li>
                      <i className="fas fa-check text-[#16a34a] mr-2"></i>
                      Unlimited Newsletters
                    </li>
                    <li>
                      <i className="fas fa-check text-[#16a34a] mr-2"></i>
                      Unlimited Subscribers
                    </li>
                    <li>
                      <i className="fas fa-check text-[#16a34a] mr-2"></i>
                      Unlimited Emails
                    </li>
                    <li>
                      <i className="fas fa-check text-[#16a34a] mr-2"></i>
                      Dedicated Support
                    </li>
                    <li>
                      <i className="fas fa-check text-[#16a34a] mr-2"></i>
                      Custom Integration
                    </li>
                    <li>
                      <i className="fas fa-check text-[#16a34a] mr-2"></i>SLA
                      Agreement
                    </li>
                    <li>
                      <i className="fas fa-check text-[#16a34a] mr-2"></i>24/7
                      Phone Support
                    </li>
                    <li>
                      <i className="fas fa-check text-[#16a34a] mr-2"></i>
                      Custom Development
                    </li>
                    <li>
                      <i className="fas fa-check text-[#16a34a] mr-2"></i>
                      Enterprise Security
                    </li>
                    <li>
                      <i className="fas fa-check text-[#16a34a] mr-2"></i>
                      Advanced Analytics Dashboard
                    </li>
                    <li>
                      <i className="fas fa-check text-[#16a34a] mr-2"></i>
                      Everything in Business
                    </li>
                    <li>
                      <i className="fas fa-check text-[#16a34a] mr-2"></i>
                      Custom Revenue Share
                    </li>
                    <li>
                      <i className="fas fa-check text-[#16a34a] mr-2"></i>
                      Enterprise Ad Network
                    </li>
                    <li>
                      <i className="fas fa-check text-[#16a34a] mr-2"></i>
                      White Label Solution
                    </li>
                    <li>
                      <i className="fas fa-check text-[#16a34a] mr-2"></i>
                      Custom Training Sessions
                    </li>
                  </ul>
                </div>
                <a
                  href="https://calendly.com/newsletterfy/meeting"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-[#06b6d4] text-[#ffffff] px-4 py-2 rounded hover:bg-[#0891b2] transition duration-300 text-center"
                >
                  Contact Sales
                </a>
              </div>
            </div>
          </section>
          <section className="bg-cyan-50 py-16">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">
                  Ready to Get Started?
                </h2>
                <p className="text-xl text-gray-600">
                  Choose your plan and start growing your newsletter today.
                </p>
              </div>
              <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                <div className="text-center">
                  <p className="text-lg mb-2">Still have questions?</p>
                  <button
                    onClick={() => scrollToSection("faq")}
                    className="text-cyan-500 hover:text-cyan-600 font-semibold"
                  >
                    Check our FAQ section{" "}
                    <i className="fas fa-arrow-right ml-2"></i>
                  </button>
                </div>
                <div className="text-center">
                  <p className="text-lg mb-2">Need custom solutions?</p>
                  <button
                    onClick={() => scrollToSection("contact")}
                    className="text-cyan-500 hover:text-cyan-600 font-semibold"
                  >
                    Contact our team <i className="fas fa-arrow-right ml-2"></i>
                  </button>
                </div>
                <div className="text-center">
                  <p className="text-lg mb-2">Ready to begin?</p>
                  <button
                    onClick={() => scrollToSection("pricing")}
                    className="bg-cyan-500 text-white px-6 py-2 rounded-full hover:bg-cyan-600 transition duration-300"
                  >
                    Get Started
                  </button>
                </div>
              </div>
            </div>
          </section>
          <section id="faq" className="bg-white py-24">
            <div className="container mx-auto px-4">
              <h2 className="text-4xl font-bold text-center mb-12">
                Frequently Asked Questions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                <div className="bg-gray-50 p-6 rounded-lg hover:shadow-md transition-shadow">
                  <h3 className="text-xl font-semibold mb-2">
                    What is Newsletterfy?
                  </h3>
                  <p className="text-gray-600">
                    Newsletterfy is a complete newsletter platform that helps
                    you create, send, and monetize newsletters. It includes
                    tools for content creation, subscriber management, and
                    various monetization options.
                  </p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg hover:shadow-md transition-shadow">
                  <h3 className="text-xl font-semibold mb-2">
                    How do sponsored ads work?
                  </h3>
                  <p className="text-gray-600">
                    Our sponsored ads feature connects you with relevant brands.
                    You can set your own rates, choose which ads to display, and
                    track performance. We handle all the billing and provide
                    analytics for both CPM and CPC campaigns.
                  </p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg hover:shadow-md transition-shadow">
                  <h3 className="text-xl font-semibold mb-2">
                    What are the revenue sharing terms?
                  </h3>
                  <p className="text-gray-600">
                    We offer competitive revenue sharing: 80% for creators on
                    all monetization features including paid subscriptions, digital product sales, tips and
                    donations, sponsored ads, and cross promotions.
                    Enterprise plans can negotiate custom terms.
                  </p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg hover:shadow-md transition-shadow">
                  <h3 className="text-xl font-semibold mb-2">
                    How do I set up paid subscriptions?
                  </h3>
                  <p className="text-gray-600">
                    Setting up paid subscriptions is simple. Choose your pricing
                    tiers, define premium content access, and we handle all
                    payment processing. You can offer monthly or yearly plans
                    with flexible pricing options.
                  </p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg hover:shadow-md transition-shadow">
                  <h3 className="text-xl font-semibold mb-2">
                    How much does it cost?
                  </h3>
                  <p className="text-gray-600">
                    We offer a free plan to get started, and paid plans starting
                    at $29/month. Each plan includes different features and
                    subscriber limits to match your needs.
                  </p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg hover:shadow-md transition-shadow">
                  <h3 className="text-xl font-semibold mb-2">
                    What monetization features are available?
                  </h3>
                  <p className="text-gray-600">
                    We offer multiple options: paid subscriptions, sponsored
                    ads, affiliate marketing, digital product sales,
                    cross-promotions, and tip jars. Each comes with dedicated
                    analytics and management tools.
                  </p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg hover:shadow-md transition-shadow">
                  <h3 className="text-xl font-semibold mb-2">
                    How do I get paid?
                  </h3>
                  <p className="text-gray-600">
                    Payments are processed automatically every month via Polar.sh
                    supporting M-Pesa, cards, and bank transfers. We support multiple currencies and provide
                    detailed earnings reports for easy accounting.
                  </p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg hover:shadow-md transition-shadow">
                  <h3 className="text-xl font-semibold mb-2">
                    What analytics do you provide for monetization?
                  </h3>
                  <p className="text-gray-600">
                    Track revenue streams, subscriber lifetime value, churn
                    rates, ad performance, and conversion metrics. Our dashboard
                    provides real-time insights to optimize your earnings.
                  </p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg hover:shadow-md transition-shadow">
                  <h3 className="text-xl font-semibold mb-2">
                    Can I import my existing subscribers?
                  </h3>
                  <p className="text-gray-600">
                    Yes! You can easily import your existing subscriber list
                    from other platforms using CSV files or our direct
                    integration tools.
                  </p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg hover:shadow-md transition-shadow">
                  <h3 className="text-xl font-semibold mb-2">
                    What payment methods do you accept?
                  </h3>
                  <p className="text-gray-600">
                    We accept all major credit cards, M-Pesa mobile money, and bank
                    transfers via Polar.sh. For premium plans, we also support custom payment
                    gateways.
                  </p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg hover:shadow-md transition-shadow">
                  <h3 className="text-xl font-semibold mb-2">
                    How do I monetize my newsletter?
                  </h3>
                  <p className="text-gray-600">
                    We offer multiple monetization options including paid
                    subscriptions, sponsored ads, cross promotions, affiliate
                    marketing, digital products, and direct tips from readers.
                  </p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg hover:shadow-md transition-shadow">
                  <h3 className="text-xl font-semibold mb-2">
                    What kind of support do you offer?
                  </h3>
                  <p className="text-gray-600">
                    All plans include email support. Premium plans get priority
                    support, and Enterprise plans include dedicated account
                    management and 24/7 phone support.
                  </p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg hover:shadow-md transition-shadow">
                  <h3 className="text-xl font-semibold mb-2">
                    Can I customize the design?
                  </h3>
                  <p className="text-gray-600">
                    Yes! Our editor offers extensive customization options. Pro
                    and Business plans include advanced design tools and custom
                    branding features.
                  </p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg hover:shadow-md transition-shadow">
                  <h3 className="text-xl font-semibold mb-2">
                    What analytics do you provide?
                  </h3>
                  <p className="text-gray-600">
                    We provide comprehensive analytics including open rates,
                    click rates, subscriber growth, revenue tracking, and
                    detailed engagement metrics.
                  </p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg hover:shadow-md transition-shadow">
                  <h3 className="text-xl font-semibold mb-2">
                    Is there a limit on email sends?
                  </h3>
                  <p className="text-gray-600">
                    Free plans include up to 5,000 emails per month. Pro and
                    Business plans offer unlimited email sends to help you reach
                    your entire audience without restrictions.
                  </p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg hover:shadow-md transition-shadow">
                  <h3 className="text-xl font-semibold mb-2">
                    Can I schedule newsletters?
                  </h3>
                  <p className="text-gray-600">
                    Yes! Our platform includes advanced scheduling features
                    allowing you to plan and automate your newsletter sends for
                    optimal engagement times across different time zones.
                  </p>
                </div>
              </div>
            </div>
          </section>
          <section className="bg-cyan-600 text-white py-20">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl font-bold mb-4">
                Ready to Start Your Newsletter Journey?
              </h2>
              <p className="text-xl mb-8">
                Join lots of creators who trust Newsletterfy to grow their
                audience and business.
              </p>
              <button
                onClick={() => scrollToSection("pricing")}
                className="bg-white text-cyan-600 px-8 py-3 rounded-full font-semibold text-lg hover:bg-cyan-100 transition duration-300"
              >
                Get Started
              </button>
            </div>
          </section>
          <footer
            id="contact"
            className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-16"
          >
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <i className="fas fa-envelope-open-text text-2xl text-cyan-600 mr-2"></i>
                    <span className="text-xl font-bold text-cyan-600">
                      Newsletterfy
                    </span>
                  </div>
                  <div className="flex space-x-4 mt-4">
                    <a
                      href="#"
                      className="text-gray-400 hover:text-cyan-400 transition-colors"
                    >
                      <i className="fab fa-twitter text-xl"></i>
                    </a>
                    <a
                      href="#"
                      className="text-gray-400 hover:text-cyan-400 transition-colors"
                    >
                      <i className="fab fa-linkedin text-xl"></i>
                    </a>
                    <a
                      href="#"
                      className="text-gray-400 hover:text-cyan-400 transition-colors"
                    >
                      <i className="fab fa-facebook text-xl"></i>
                    </a>
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-4">Product</h4>
                  <ul className="space-y-2">
                    <li>
                      <a
                        onClick={() => scrollToSection("features")}
                        href="#"
                        className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                      >
                        Features
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        Pricing
                      </a>
                    </li>
                    <li>
                      <a
                        onClick={handleDirectoryClick}
                        href="#"
                        className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                      >
                        Directory
                      </a>
                    </li>
                    <li>
                      <a
                        onClick={handleMarketplaceClick}
                        href="#"
                        className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                      >
                        Marketplace
                      </a>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-4">Support</h4>
                  <ul className="space-y-2">
                    <li>
                      <a
                        href="#"
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        Help Center
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        Documentation
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        Contact Us
                      </a>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-4">Legal</h4>
                  <ul className="space-y-2">
                    <li>
                      <a
                        onClick={handlePrivacyClick}
                        href="#"
                        className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                      >
                        Privacy Policy
                      </a>
                    </li>
                    <li>
                      <a
                        onClick={handleTermsClick}
                        href="#"
                        className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                      >
                        Terms of Service
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        Cookie Policy
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="border-t border-gray-800 mt-12 pt-8">
                <div className="flex flex-col md:flex-row justify-between items-center">
                  <p className="text-gray-400 text-sm">
                    &copy; 2024 Newsletterfy. All rights reserved.
                  </p>
                  <div className="flex space-x-6 mt-4 md:mt-0">
                    <a
                      href="#"
                      className="text-gray-400 hover:text-white text-sm transition-colors"
                    >
                      Status
                    </a>
                    <a
                      href="#"
                      className="text-gray-400 hover:text-white text-sm transition-colors"
                    >
                      Security
                    </a>
                    <a
                      href="#"
                      className="text-gray-400 hover:text-white text-sm transition-colors"
                    >
                      Sitemap
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </footer>


        </div>
      </div>
    </div>
  );
}

export default MainComponent;