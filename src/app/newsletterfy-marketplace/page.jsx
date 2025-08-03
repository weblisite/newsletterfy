"use client";
import React from "react";

function MainComponent() {
  const [newsletters, setNewsletters] = React.useState([
    {
      id: 1,
      title: "Tech Weekly Digest",
      subscribers: 15000,
      openRate: 45,
      revenue: 2500,
      niche: "Technology",
      price: 25000,
      listingFee: 25,
      brokerFee: 2500,
      description: "Weekly tech news and analysis with engaged audience",
      image: "/newsletter1.jpg",
      verified: true,
      verifiedMetrics: {
        subscribers: true,
        revenue: true,
        engagement: true,
        platform: true,
        analytics: true,
        ownership: true,
      },
      verificationDetails: {
        subscribersVerifiedDate: "2024-01-15",
        revenueVerifiedDate: "2024-01-15",
        platformVerifiedDate: "2024-01-15",
        verificationMethod: "Direct API Integration",
        verifiedBy: "Newsletterfy Team",
        analyticsAccess: "Full Access Granted",
        ownershipProof: "Domain & Platform Verified",
      },
      demographics: {
        age: {
          "25-34": 60,
          "35-44": 25,
          "45+": 15,
        },
        location: {
          US: 75,
          Europe: 15,
          Other: 10,
        },
      },
      growth: {
        monthlyRate: 15,
        churnRate: 2.5,
      },
      sampleContent:
        "Latest tech trends and insights delivered to your inbox. From AI breakthroughs to startup news, we cover it all.",
      transferDetails: {
        platform: "Substack",
        subscribers: "CSV Export",
        assets: "Dropbox folder",
        support: "30 days",
        timeline: "7-14 days",
        legalDocs: [
          "Asset Purchase Agreement",
          "Non-Compete",
          "Confidentiality",
        ],
        escrowService: "Escrow.com",
        steps: [
          "Initial kickoff call with transfer specialist (Day 1)",
          "Sign legal documents and initiate escrow (Day 2-3)",
          "Export and verify subscriber data integrity (Day 4-5)",
          "Transfer ownership of Substack publication (Day 6-7)",
          "Share access to content archive and assets (Day 8)",
          "Buyer review period (Day 9-11)",
          "Final payment release and handover (Day 12-14)",
        ],
        support_includes: [
          "Daily email support",
          "Weekly check-in calls",
          "Technical migration assistance",
          "Subscriber communication templates",
          "Post-transfer optimization tips",
        ],
        transferProtocols: {
          preTransfer: [
            "Verify all login credentials",
            "Backup all subscriber data",
            "Document monetization settings",
            "Prepare welcome message for subscribers",
          ],
          duringTransfer: [
            "Step-by-step platform access transfer",
            "Real-time verification checks",
            "Subscriber data migration monitoring",
            "Payment processor transition",
          ],
          postTransfer: [
            "Access confirmation for all systems",
            "Test subscriber communications",
            "Verify analytics tracking",
            "Monitor email deliverability",
          ],
        },
      },
    },
    {
      id: 2,
      title: "Finance Insider",
      subscribers: 8000,
      openRate: 52,
      revenue: 1800,
      niche: "Finance",
      price: 18000,
      listingFee: 25,
      brokerFee: 1800,
      description: "Premium financial insights and market analysis",
      image: "/newsletter2.jpg",
      verified: true,
      verifiedMetrics: {
        subscribers: true,
        revenue: true,
        engagement: true,
        platform: true,
        analytics: true,
        ownership: true,
      },
      verificationDetails: {
        subscribersVerifiedDate: "2024-01-10",
        revenueVerifiedDate: "2024-01-10",
        platformVerifiedDate: "2024-01-10",
        verificationMethod: "Manual Verification",
        verifiedBy: "Newsletterfy Team",
        analyticsAccess: "Read Access Granted",
        ownershipProof: "Platform Verified",
      },
      demographics: {
        age: {
          "25-34": 45,
          "35-44": 35,
          "45+": 20,
        },
        location: {
          US: 65,
          Europe: 25,
          Other: 10,
        },
      },
      growth: {
        monthlyRate: 12,
        churnRate: 1.8,
      },
      sampleContent:
        "Deep dive into market trends, investment strategies, and financial planning advice for the modern investor.",
      transferDetails: {
        platform: "Ghost",
        subscribers: "API Transfer",
        assets: "Google Drive",
        support: "45 days",
        timeline: "10-15 days",
        legalDocs: [
          "Asset Purchase Agreement",
          "Non-Compete",
          "Confidentiality",
        ],
        escrowService: "Escrow.com",
        steps: [
          "Initial strategy meeting and paperwork (Day 1-2)",
          "Legal document review and signing (Day 3-4)",
          "Set up Ghost instance and configure settings (Day 5-6)",
          "API-based subscriber migration (Day 7-8)",
          "Transfer domain ownership (Day 9-10)",
          "Content and asset migration (Day 11-12)",
          "Testing and verification period (Day 13-15)",
        ],
        support_includes: [
          "24/7 priority email support",
          "Bi-weekly strategy calls",
          "Platform training sessions",
          "Custom migration scripts",
          "SEO preservation guidance",
        ],
        transferProtocols: {
          preTransfer: [
            "Audit current Ghost setup",
            "Export member database backup",
            "Document theme customizations",
            "Prepare migration environment",
          ],
          duringTransfer: [
            "Execute API migration scripts",
            "Monitor data integrity",
            "Update payment integrations",
            "Transfer custom domains",
          ],
          postTransfer: [
            "Verify email delivery setup",
            "Test member login flow",
            "Check recurring payments",
            "Monitor site performance",
          ],
        },
      },
    },
  ]);
  const [showModal, setShowModal] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedNiche, setSelectedNiche] = React.useState("");
  const [sortBy, setSortBy] = React.useState("price-asc");
  const [showProfileModal, setShowProfileModal] = React.useState(false);
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [userProfile, setUserProfile] = React.useState(null);
  const [showPurchaseModal, setShowPurchaseModal] = React.useState(false);
  const [selectedNewsletter, setSelectedNewsletter] = React.useState(null);
  const handleSellNewsletter = () => {
    setShowModal(true);
  };
  const [showDetails, setShowDetails] = React.useState(false);
  const handleLogin = () => {
    setUserProfile({
      name: "John Doe",
      email: "john@example.com",
      interestedNiches: ["Technology", "Finance"],
      savedNewsletters: [],
    });
    setIsLoggedIn(true);
    setShowProfileModal(false);
  };
  const handlePurchase = () => {
    if (!isLoggedIn) {
      setShowProfileModal(true);
      return;
    }
    setShowPurchaseModal(true);
  };
  const filteredNewsletters = React.useMemo(() => {
    let filtered = [...newsletters];

    if (searchTerm) {
      filtered = filtered.filter(
        (newsletter) =>
          newsletter.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          newsletter.description
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    if (selectedNiche) {
      filtered = filtered.filter(
        (newsletter) => newsletter.niche === selectedNiche
      );
    }

    switch (sortBy) {
      case "price-asc":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "subscribers-desc":
        filtered.sort((a, b) => b.subscribers - a.subscribers);
        break;
      default:
        break;
    }

    return filtered;
  }, [newsletters, searchTerm, selectedNiche, sortBy]);
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-700">
      <nav className="bg-white shadow-lg fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <i className="fas fa-envelope-open-text text-2xl text-[#2563eb] mr-2"></i>
              <span className="text-xl font-bold text-[#2563eb] font-poppins">
                Newsletterfy
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <button className="text-[#4b5563] hover:text-[#2563eb] font-poppins">
                Browse
              </button>
              {isLoggedIn ? (
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="text-[#4b5563] hover:text-[#2563eb] font-poppins flex items-center"
                >
                  <i className="fas fa-user-circle mr-2"></i>
                  Profile
                </button>
              ) : (
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="text-[#4b5563] hover:text-[#2563eb] font-poppins"
                >
                  Sign In
                </button>
              )}
              <button
                onClick={handleSellNewsletter}
                className="bg-[#2563eb] text-white px-6 py-2 rounded-lg hover:bg-[#1d4ed8] font-poppins"
              >
                Sell Newsletter
              </button>
            </div>
            <button className="md:hidden text-[#4b5563]">
              <i className="fas fa-bars text-xl"></i>
            </button>
          </div>
        </div>
      </nav>
      {!showDetails ? (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20">
          <div className="bg-white rounded-xl p-8 mb-8 shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-center font-poppins">
              Why Choose Newsletterfy?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-blue-50 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                  <i className="fas fa-dollar-sign text-2xl text-blue-600"></i>
                </div>
                <h3 className="text-lg font-semibold mb-2 font-poppins">
                  For Sellers
                </h3>
                <p className="text-gray-600 font-poppins">
                  Monetize your newsletter and get the best value for your hard
                  work
                </p>
              </div>
              <div className="text-center">
                <div className="bg-blue-50 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                  <i className="fas fa-rocket text-2xl text-blue-600"></i>
                </div>
                <h3 className="text-lg font-semibold mb-2 font-poppins">
                  For Buyers
                </h3>
                <p className="text-gray-600 font-poppins">
                  Skip the building phase and acquire an established audience
                  instantly
                </p>
              </div>
              <div className="text-center">
                <div className="bg-blue-50 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                  <i className="fas fa-shield-alt text-2xl text-blue-600"></i>
                </div>
                <h3 className="text-lg font-semibold mb-2 font-poppins">
                  Secure Platform
                </h3>
                <p className="text-gray-600 font-poppins">
                  Verified metrics and secure escrow payments for peace of mind
                </p>
              </div>
            </div>
            <div className="mt-8 text-center">
              <div className="inline-flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg">
                <i className="fas fa-info-circle text-blue-600"></i>
                <span className="text-sm text-blue-600 font-poppins">
                  $25 listing fee + 10% broker fee on successful sales
                </span>
              </div>
            </div>
          </div>
          <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="w-full md:w-96">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search newsletters..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-[#3b82f6] font-poppins"
                />
                <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
              </div>
            </div>
            <div className="flex gap-4">
              <select
                value={selectedNiche}
                onChange={(e) => setSelectedNiche(e.target.value)}
                className="border rounded-lg px-4 py-2 focus:outline-none focus:border-[#3b82f6] font-poppins"
              >
                <option value="">All Niches</option>
                <option value="Technology">Technology</option>
                <option value="Finance">Finance</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border rounded-lg px-4 py-2 focus:outline-none focus:border-[#3b82f6] font-poppins"
              >
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="subscribers-desc">Most Subscribers</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredNewsletters.map((newsletter) => (
              <div
                key={newsletter.id}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-[#1a365d]"
              >
                <div className="relative">
                  <img
                    src={newsletter.image}
                    alt={`Preview of ${newsletter.title} newsletter`}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-4 right-4 bg-[#16a34a] text-white px-3 py-1 rounded-full flex items-center">
                    <i className="fas fa-check-circle mr-1"></i>
                    <span className="text-sm font-poppins">Verified</span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2 font-poppins">
                    {newsletter.title}
                  </h3>
                  <p className="text-gray-600 mb-4 font-poppins">
                    {newsletter.description}
                  </p>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <span className="font-medium font-poppins">
                        Subscribers
                      </span>
                      <p className="text-[#3b82f6] font-poppins">
                        {newsletter.subscribers.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium font-poppins">
                        Open Rate
                      </span>
                      <p className="text-[#3b82f6] font-poppins">
                        {newsletter.openRate}%
                      </p>
                    </div>
                    <div>
                      <span className="font-medium font-poppins">
                        Monthly Revenue
                      </span>
                      <p className="text-[#3b82f6] font-poppins">
                        ${newsletter.revenue}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium font-poppins">Niche</span>
                      <p className="text-[#3b82f6] font-poppins">
                        {newsletter.niche}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-[#1e293b] font-poppins">
                      ${newsletter.price.toLocaleString()}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedNewsletter(newsletter);
                        setShowDetails(true);
                      }}
                      className="bg-[#3b82f6] text-white px-4 py-2 rounded-lg hover:bg-[#2563eb] font-poppins"
                    >
                      View Details
                    </button>
                  </div>
                </div>
                <div className="px-6 pb-4">
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(newsletter.verifiedMetrics).map(
                      ([key, value]) =>
                        value && (
                          <div
                            key={key}
                            className="flex items-center bg-green-50 px-2 py-1 rounded-full"
                          >
                            <i className="fas fa-check-circle text-green-500 mr-1 text-sm"></i>
                            <span className="text-xs text-green-700 capitalize font-poppins">
                              {key}
                            </span>
                          </div>
                        )
                    )}
                  </div>
                  <div className="mt-2 text-xs text-gray-500 font-poppins">
                    Last verified:{" "}
                    {newsletter.verificationDetails.subscribersVerifiedDate}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      ) : (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20">
          <button
            onClick={() => setShowDetails(false)}
            className="mb-6 flex items-center text-[#3b82f6] font-poppins"
          >
            <i className="fas fa-arrow-left mr-2"></i> Back to Listings
          </button>
          <div className="bg-white rounded-xl shadow-lg p-8 border border-[#1a365d]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <div className="relative">
                  <img
                    src={selectedNewsletter?.image}
                    alt={`Preview of ${selectedNewsletter?.title} newsletter`}
                    className="w-full h-[300px] object-cover rounded-lg"
                  />
                  <div className="absolute top-4 right-4 bg-[#16a34a] text-white px-3 py-1 rounded-full flex items-center">
                    <i className="fas fa-check-circle mr-1"></i>
                    <span className="text-sm font-poppins">Verified</span>
                  </div>
                </div>
                <div className="mt-6 space-y-6">
                  <div className="bg-blue-100 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 font-poppins">
                      Newsletter Stats
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-600 font-poppins">
                          Subscribers
                        </p>
                        <p className="text-xl font-semibold font-poppins">
                          {selectedNewsletter?.subscribers.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 font-poppins">Open Rate</p>
                        <p className="text-xl font-semibold font-poppins">
                          {selectedNewsletter?.openRate}%
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 font-poppins">
                          Monthly Revenue
                        </p>
                        <p className="text-xl font-semibold font-poppins">
                          ${selectedNewsletter?.revenue}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 font-poppins">Niche</p>
                        <p className="text-xl font-semibold font-poppins">
                          {selectedNewsletter?.niche}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-100 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 font-poppins">
                      Subscriber Demographics
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-gray-600 font-poppins">
                          Age Distribution
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 bg-blue-200 rounded-full h-4">
                            <div className="bg-blue-500 rounded-full h-4 w-[60%]"></div>
                          </div>
                          <span className="text-sm font-poppins">
                            25-34 (60%)
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-600 font-poppins">Location</p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 bg-blue-200 rounded-full h-4">
                            <div className="bg-blue-500 rounded-full h-4 w-[75%]"></div>
                          </div>
                          <span className="text-sm font-poppins">US (75%)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-100 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 font-poppins">
                      Growth Trends
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-gray-600 font-poppins">
                          Monthly Growth Rate
                        </p>
                        <p className="text-xl font-semibold text-green-500 font-poppins">
                          +15%
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 font-poppins">Churn Rate</p>
                        <p className="text-xl font-semibold text-red-500 font-poppins">
                          2.5%
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-100 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 font-poppins">
                      Sample Content
                    </h3>
                    <div className="bg-white p-4 rounded-lg">
                      <h4 className="font-semibold mb-2 font-poppins">
                        Latest Issue Preview
                      </h4>
                      <p className="text-gray-600 font-poppins line-clamp-4">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                        Sed do eiusmod tempor incididunt ut labore et dolore
                        magna aliqua. Ut enim ad minim veniam, quis nostrud
                        exercitation ullamco laboris nisi ut aliquip ex ea
                        commodo consequat.
                      </p>
                      <button className="text-blue-600 mt-2 font-poppins">
                        Read more
                      </button>
                    </div>
                  </div>

                  <div className="bg-green-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 font-poppins text-green-800">
                      Verification Details
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(
                        selectedNewsletter?.verificationDetails || {}
                      ).map(([key, value]) => (
                        <div
                          key={key}
                          className="flex justify-between items-center"
                        >
                          <span className="text-green-700 capitalize font-poppins">
                            {key.replace(/([A-Z])/g, " $1").trim()}
                          </span>
                          <span className="text-green-800 font-medium font-poppins">
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-4 font-poppins">
                  {selectedNewsletter?.title}
                </h2>
                <p className="text-gray-600 mb-6 font-poppins">
                  {selectedNewsletter?.description}
                </p>
                <div className="border-t border-[#1a365d] py-6">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-3xl font-bold text-[#1e293b] font-poppins">
                      ${selectedNewsletter?.price.toLocaleString()}
                    </span>
                    <button
                      onClick={handlePurchase}
                      className="bg-[#3b82f6] text-white px-8 py-3 rounded-lg hover:bg-[#2563eb] font-poppins"
                    >
                      Purchase Newsletter
                    </button>
                  </div>
                  <div className="bg-blue-100 p-6 rounded-lg mb-6">
                    <h3 className="text-lg font-semibold mb-4 font-poppins">
                      Transfer Details
                    </h3>
                    <ul className="space-y-3">
                      <li className="flex items-center justify-between font-poppins">
                        <span className="text-gray-600">Platform</span>
                        <span className="font-medium">
                          {selectedNewsletter?.transferDetails.platform}
                        </span>
                      </li>
                      <li className="flex items-center justify-between font-poppins">
                        <span className="text-gray-600">
                          Subscriber Transfer
                        </span>
                        <span className="font-medium">
                          {selectedNewsletter?.transferDetails.subscribers}
                        </span>
                      </li>
                      <li className="flex items-center justify-between font-poppins">
                        <span className="text-gray-600">Asset Delivery</span>
                        <span className="font-medium">
                          {selectedNewsletter?.transferDetails.assets}
                        </span>
                      </li>
                      <li className="flex items-center justify-between font-poppins">
                        <span className="text-gray-600">Support Period</span>
                        <span className="font-medium">
                          {selectedNewsletter?.transferDetails.support}
                        </span>
                      </li>
                    </ul>
                  </div>
                  <div className="bg-blue-100 p-6 rounded-lg mb-6">
                    <h3 className="text-lg font-semibold mb-4 font-poppins">
                      Transfer Process
                    </h3>
                    <div className="bg-blue-50 p-4 rounded-lg mb-4">
                      <p className="text-sm text-blue-800 font-poppins">
                        Estimated Timeline:{" "}
                        {selectedNewsletter?.transferDetails.timeline}
                      </p>
                      <p className="text-sm text-blue-800 font-poppins mt-2">
                        Escrow Service:{" "}
                        {selectedNewsletter?.transferDetails.escrowService}
                      </p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg mb-4">
                      <h4 className="font-medium mb-2 font-poppins">
                        Legal Documents
                      </h4>
                      <ul className="space-y-1">
                        {selectedNewsletter?.transferDetails.legalDocs.map(
                          (doc, index) => (
                            <li
                              key={index}
                              className="flex items-center text-sm font-poppins"
                            >
                              <i className="fas fa-file-contract text-blue-600 mr-2"></i>
                              {doc}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2 font-poppins">
                          Transfer Timeline
                        </h4>
                        <ul className="space-y-2">
                          {selectedNewsletter?.transferDetails.steps.map(
                            (step, index) => (
                              <li
                                key={index}
                                className="flex items-start font-poppins"
                              >
                                <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-sm mr-2 mt-0.5">
                                  {index + 1}
                                </span>
                                {step}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                      <div className="mt-4">
                        <h4 className="font-medium mb-2 font-poppins">
                          Transfer Protocols
                        </h4>
                        <div className="space-y-4">
                          <div>
                            <h5 className="text-sm font-medium text-blue-800 mb-2 font-poppins">
                              Pre-Transfer Checklist
                            </h5>
                            <ul className="space-y-1">
                              {selectedNewsletter?.transferDetails.transferProtocols.preTransfer.map(
                                (item, index) => (
                                  <li
                                    key={index}
                                    className="flex items-center text-sm font-poppins"
                                  >
                                    <i className="fas fa-check-circle text-green-500 mr-2"></i>
                                    {item}
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                          <div>
                            <h5 className="text-sm font-medium text-blue-800 mb-2 font-poppins">
                              During Transfer
                            </h5>
                            <ul className="space-y-1">
                              {selectedNewsletter?.transferDetails.transferProtocols.duringTransfer.map(
                                (item, index) => (
                                  <li
                                    key={index}
                                    className="flex items-center text-sm font-poppins"
                                  >
                                    <i className="fas fa-sync text-blue-500 mr-2"></i>
                                    {item}
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                          <div>
                            <h5 className="text-sm font-medium text-blue-800 mb-2 font-poppins">
                              Post-Transfer Verification
                            </h5>
                            <ul className="space-y-1">
                              {selectedNewsletter?.transferDetails.transferProtocols.postTransfer.map(
                                (item, index) => (
                                  <li
                                    key={index}
                                    className="flex items-center text-sm font-poppins"
                                  >
                                    <i className="fas fa-clipboard-check text-purple-500 mr-2"></i>
                                    {item}
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2 font-poppins">
                          Support Package Includes
                        </h4>
                        <ul className="space-y-2">
                          {selectedNewsletter?.transferDetails.support_includes.map(
                            (item, index) => (
                              <li
                                key={index}
                                className="flex items-center font-poppins"
                              >
                                <i className="fas fa-check-circle text-green-500 mr-2"></i>
                                {item}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-100 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 font-poppins">
                      What's Included
                    </h3>
                    <ul className="space-y-3">
                      <li className="flex items-center font-poppins">
                        <i className="fas fa-check text-green-500 mr-2"></i>
                        Full subscriber list and data
                      </li>
                      <li className="flex items-center font-poppins">
                        <i className="fas fa-check text-green-500 mr-2"></i>
                        Newsletter branding assets
                      </li>
                      <li className="flex items-center font-poppins">
                        <i className="fas fa-check text-green-500 mr-2"></i>
                        Content archive and templates
                      </li>
                      <li className="flex items-center font-poppins">
                        <i className="fas fa-check text-green-500 mr-2"></i>
                        Transfer support
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-xl max-w-md w-full border border-[#1a365d]">
            <h2 className="text-2xl font-bold mb-4 font-poppins">
              List Your Newsletter
            </h2>
            <form className="space-y-4">
              <div>
                <label className="block mb-1 font-poppins">
                  Newsletter Title
                </label>
                <input
                  type="text"
                  name="title"
                  className="w-full border rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block mb-1 font-poppins">Description</label>
                <textarea
                  name="description"
                  className="w-full border rounded-lg p-2"
                  rows="3"
                ></textarea>
              </div>
              <div>
                <label className="block mb-1 font-poppins">Asking Price</label>
                <input
                  type="number"
                  name="price"
                  className="w-full border rounded-lg p-2"
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="text-gray-600 font-poppins"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#3b82f6] text-white px-4 py-2 rounded-lg hover:bg-[#2563eb] font-poppins flex items-center"
                >
                  <span>List for $25</span>
                  <i
                    className="fas fa-info-circle ml-2"
                    title="One-time listing fee"
                  ></i>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl max-w-md w-full border border-[#1a365d]">
            {isLoggedIn ? (
              <>
                <h2 className="text-2xl font-bold mb-4 font-poppins">
                  Your Profile
                </h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-600 font-poppins">Name</p>
                    <p className="font-semibold font-poppins">
                      {userProfile.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-poppins">Email</p>
                    <p className="font-semibold font-poppins">
                      {userProfile.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-poppins">
                      Interested Niches
                    </p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {userProfile.interestedNiches.map((niche) => (
                        <span
                          key={niche}
                          className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-poppins"
                        >
                          {niche}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsLoggedIn(false);
                      setUserProfile(null);
                      setShowProfileModal(false);
                    }}
                    className="w-full bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 font-poppins mt-4"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold mb-4 font-poppins">
                  Sign In
                </h2>
                <form className="space-y-4">
                  <div>
                    <label className="block mb-1 font-poppins">Email</label>
                    <input
                      type="email"
                      name="email"
                      className="w-full border rounded-lg p-2"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-poppins">Password</label>
                    <input
                      type="password"
                      name="password"
                      className="w-full border rounded-lg p-2"
                    />
                  </div>
                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => setShowProfileModal(false)}
                      className="text-gray-600 font-poppins"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleLogin}
                      className="bg-[#3b82f6] text-white px-4 py-2 rounded-lg hover:bg-[#2563eb] font-poppins"
                    >
                      Sign In
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl max-w-md w-full border border-[#1a365d]">
            <h2 className="text-2xl font-bold mb-6 font-poppins">
              Complete Purchase
            </h2>
            <div className="space-y-6">
              <div className="border-b pb-4">
                <h3 className="font-semibold mb-2 font-poppins">
                  Purchase Summary
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-poppins">
                      Newsletter Price
                    </span>
                    <span className="font-medium font-poppins">
                      ${selectedNewsletter?.price.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-poppins flex items-center">
                      Broker Fee (10%)
                      <i
                        className="fas fa-info-circle ml-1"
                        title="Standard broker fee for facilitating the transfer"
                      ></i>
                    </span>
                    <span className="font-medium font-poppins">
                      ${(selectedNewsletter?.price * 0.1).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold mt-4">
                    <span className="font-poppins">Total</span>
                    <span className="font-poppins">
                      ${(selectedNewsletter?.price * 1.1).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block mb-1 font-poppins">Card Number</label>
                  <input
                    type="text"
                    name="cardNumber"
                    className="w-full border rounded-lg p-2"
                    placeholder="**** **** **** ****"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 font-poppins">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      name="expiry"
                      className="w-full border rounded-lg p-2"
                      placeholder="MM/YY"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-poppins">CVV</label>
                    <input
                      type="text"
                      name="cvv"
                      className="w-full border rounded-lg p-2"
                      placeholder="***"
                    />
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 font-poppins">
                  Your payment is secure and protected. Funds will be held in
                  escrow until the transfer is complete.
                </p>
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowPurchaseModal(false)}
                  className="text-gray-600 font-poppins"
                >
                  Cancel
                </button>
                <button className="bg-[#3b82f6] text-white px-6 py-2 rounded-lg hover:bg-[#2563eb] font-poppins">
                  Complete Purchase
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MainComponent;