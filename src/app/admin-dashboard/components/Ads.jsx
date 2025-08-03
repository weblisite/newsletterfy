"use client";
import React from 'react';

export default function Ads() {
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
  const [selectedNewsletter, setSelectedNewsletter] = React.useState("");
  const [distributedAds, setDistributedAds] = React.useState([]);

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

  return (
    <div className="animate-fadeIn p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            Create New Ad
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              name="company"
              placeholder="Company Name"
              value={newAd.company}
              onChange={handleInputChange}
              className="px-4 py-2 border rounded-lg"
            />
            <input
              type="text"
              name="targetUrl"
              placeholder="Target URL"
              value={newAd.targetUrl}
              onChange={handleInputChange}
              className="px-4 py-2 border rounded-lg"
            />
            <textarea
              name="adCopy"
              placeholder="Ad Copy"
              value={newAd.adCopy}
              onChange={handleInputChange}
              className="px-4 py-2 border rounded-lg md:col-span-2"
              rows="3"
            />
            <select
              name="paymentType"
              value={newAd.paymentType}
              onChange={handleInputChange}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="CPM">Cost per Mile (CPM)</option>
              <option value="CPC">Cost per Click (CPC)</option>
              <option value="Fixed">Fixed Price</option>
            </select>
            <input
              type="number"
              name="amount"
              placeholder="Amount"
              value={newAd.amount}
              onChange={handleInputChange}
              className="px-4 py-2 border rounded-lg"
            />
            <input
              type="date"
              name="postDate"
              value={newAd.postDate}
              onChange={handleInputChange}
              className="px-4 py-2 border rounded-lg"
            />
            <button
              onClick={handleAddAd}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Ad
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">
              Ad Distribution
            </h3>
            <select
              value={selectedNewsletter}
              onChange={(e) => setSelectedNewsletter(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="">Select Newsletter</option>
              {staticNewsletters.map((newsletter) => (
                <option key={newsletter.id} value={newsletter.name}>
                  {newsletter.name}
                </option>
              ))}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ad Copy
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ads.map((ad) => (
                  <tr key={ad.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {ad.company}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {ad.adCopy}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {ad.paymentType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${ad.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          ad.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {ad.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <button
                        onClick={() => handleDistributeAd(ad)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Distribute
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 