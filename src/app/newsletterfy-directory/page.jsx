"use client";
import React from "react";

import { useUpload } from "../../utilities/runtime-helpers";

function MainComponent() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("all");
  const [selectedSubscriberRange, setSelectedSubscriberRange] =
    React.useState("all");
  const [newsletters, setNewsletters] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [filterDebug, setFilterDebug] = React.useState({});
  const [subscriberDebug, setSubscriberDebug] = React.useState(null);
  const [dbDebug, setDbDebug] = React.useState(null);
  const [imageError, setImageError] = React.useState({});

  React.useEffect(() => {
    const loadNewsletters = async () => {
      try {
        const response = await fetch("/api/db/newsletterfydirectorydatabase", {
          method: "POST",
          body: JSON.stringify({
            query:
              "CREATE TABLE IF NOT EXISTS `newsletters` (`id` VARCHAR(255), `name` VARCHAR(255), `description` TEXT, `category` VARCHAR(255), `subscriber_count` INT, `image` VARCHAR(255), `featured` BOOLEAN)",
          }),
        });

        if (!response.ok) {
          setError(`Database error: ${response.status}`);
          return;
        }

        const insertResponse = await fetch(
          "/api/db/newsletterfydirectorydatabase",
          {
            method: "POST",
            body: JSON.stringify({
              query:
                "INSERT INTO `newsletters` (`name`, `description`, `category`, `subscriber_count`, `image`, `featured`) SELECT * FROM (SELECT 'Tech Weekly' as name, 'Your weekly dose of tech news and insights' as description, 'Technology' as category, 5000 as subscriber_count, '/placeholder-tech.jpg' as image, true as featured) AS tmp WHERE NOT EXISTS (SELECT 1 FROM `newsletters` WHERE `name` = 'Tech Weekly')",
            }),
          }
        );

        const validationResponse = await fetch(
          "/api/db/newsletterfydirectorydatabase",
          {
            method: "POST",
            body: JSON.stringify({
              query: "SELECT * FROM `newsletters` ORDER BY featured DESC",
            }),
          }
        );

        const { data: validationData, error: validationError } =
          await validationResponse.json();
        setDbDebug({ validationData, validationError });

        if (!validationResponse.ok) {
          setError(`Failed to fetch newsletters: ${validationResponse.status}`);
          return;
        }

        if (validationError) {
          setError(`Error loading newsletters: ${validationError}`);
          return;
        }

        if (!validationData) {
          setError("No data received from the server");
          return;
        }

        setNewsletters(validationData);
        setError(null);
      } catch (error) {
        setError(`Unexpected error: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    loadNewsletters();
  }, []);

  React.useEffect(() => {
    console.log("Fetched newsletters:", newsletters);
  }, [newsletters]);

  React.useEffect(() => {
    const filterResults = {};
    const filtered = newsletters.filter((newsletter) => {
      const matchesSearch =
        newsletter.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        newsletter.description
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || newsletter.category === selectedCategory;

      let matchesSubscribers = false;
      if (selectedSubscriberRange === "all") {
        matchesSubscribers = true;
      } else if (selectedSubscriberRange.endsWith("+")) {
        const minCount = parseInt(selectedSubscriberRange.slice(0, -1));
        matchesSubscribers = newsletter.subscriber_count >= minCount;
      } else {
        const [min, max] = selectedSubscriberRange.split("-").map(Number);
        matchesSubscribers =
          newsletter.subscriber_count >= min &&
          newsletter.subscriber_count <= max;
      }

      filterResults[newsletter.id] = {
        matchesSearch,
        matchesCategory,
        matchesSubscribers,
      };

      return matchesSearch && matchesCategory && matchesSubscribers;
    });
    console.log("Filtered newsletters:", filteredNewsletters);
  }, [newsletters, searchTerm, selectedCategory, selectedSubscriberRange]);

  const handleImageError = (newsletterId) => {
    setImageError((prev) => ({
      ...prev,
      [newsletterId]: true,
    }));
    console.error(`Failed to load image for newsletter ${newsletterId}`);
  };
  const categories = [
    "Technology",
    "Finance",
    "Health",
    "Business",
    "Lifestyle",
    "Sports",
    "Entertainment",
    "Education",
    "Science",
    "Politics",
    "Food & Cooking",
    "Travel",
    "Fashion",
    "Gaming",
    "Art & Design",
    "Environment",
    "Personal Development",
    "Parenting",
    "Music",
    "Real Estate",
    "Productivity",
    "Work",
    "Remote Work",
    "Make Money",
    "Mindset",
    "Career Development",
    "Entrepreneurship",
    "Marketing",
    "Writing",
    "Crypto",
  ];
  const subscriberRanges = [
    { label: "0-1K", value: "0-1000" },
    { label: "1K-5K", value: "1000-5000" },
    { label: "5K-10K", value: "5000-10000" },
    { label: "10K-25K", value: "10000-25000" },
    { label: "25K-50K", value: "25000-50000" },
    { label: "50K-100K", value: "50000-100000" },
    { label: "100K-500K", value: "100000-500000" },
    { label: "500K-1M", value: "500000-1000000" },
    { label: "1M+", value: "1000000+" },
  ];
  const filteredNewsletters = newsletters.filter((newsletter) => {
    const matchesSearch =
      newsletter.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      newsletter.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || newsletter.category === selectedCategory;

    let matchesSubscribers = false;
    if (selectedSubscriberRange === "all") {
      matchesSubscribers = true;
    } else if (selectedSubscriberRange.endsWith("+")) {
      const minCount = parseInt(selectedSubscriberRange.slice(0, -1));
      matchesSubscribers = newsletter.subscriber_count >= minCount;
    } else {
      const [min, max] = selectedSubscriberRange.split("-").map(Number);
      matchesSubscribers =
        newsletter.subscriber_count >= min &&
        newsletter.subscriber_count <= max;
    }

    return matchesSearch && matchesCategory && matchesSubscribers;
  });
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: "",
    description: "",
    category: "",
    subscriberCount: "",
    image: null,
  });
  const [upload, { loading: uploading }] = useUpload();
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.image) {
        setError("Please upload an image");
        return;
      }

      const {
        url,
        error: uploadError,
        mimeType,
      } = await upload({
        file: formData.image,
      });

      if (!url || uploadError) {
        setError(
          `Error uploading image: ${uploadError || "Invalid URL received"}`
        );
        console.error("Upload error or invalid URL:", uploadError || url);
        return;
      }

      if (!mimeType?.startsWith("image/")) {
        setError("Please upload a valid image file");
        return;
      }

      let subscriberCount;
      if (formData.subscriberCount.endsWith("+")) {
        subscriberCount = parseInt(formData.subscriberCount.slice(0, -1));
      } else {
        const [min] = formData.subscriberCount.split("-").map(Number);
        subscriberCount = min;
      }

      console.log("Parsed subscriber count:", subscriberCount);
      setSubscriberDebug(subscriberCount);

      if (isNaN(subscriberCount)) {
        setError("Invalid subscriber count format");
        return;
      }

      const response = await fetch("/api/db/newsletterfydirectorydatabase", {
        method: "POST",
        body: JSON.stringify({
          query:
            "INSERT INTO `newsletters` (`name`, `description`, `category`, `subscriber_count`, `image`, `featured`) VALUES (?, ?, ?, ?, ?, ?)",
          values: [
            formData.name,
            formData.description,
            formData.category,
            subscriberCount,
            url,
            false,
          ],
        }),
      });

      if (!response.ok) {
        setError(`Failed to save newsletter: ${response.status}`);
        return;
      }

      const { error } = await response.json();
      if (error) {
        setError(`Error saving newsletter: ${error}`);
        return;
      }

      setError(null);
      setIsModalOpen(false);
      setFormData({
        name: "",
        description: "",
        category: "",
        subscriberCount: "",
        image: null,
      });

      const refreshResponse = await fetch(
        "/api/db/newsletterfydirectorydatabase",
        {
          method: "POST",
          body: JSON.stringify({
            query: "SELECT * FROM `newsletters` ORDER BY featured DESC",
          }),
        }
      );

      if (!refreshResponse.ok) {
        setError(`Failed to refresh newsletters: ${refreshResponse.status}`);
        return;
      }

      const { data: newData, error: refreshError } =
        await refreshResponse.json();
      if (refreshError) {
        setError(`Error refreshing newsletters: ${refreshError}`);
        return;
      }

      if (newData) {
        setNewsletters(newData);
      }
    } catch (error) {
      setError(`Unexpected error: ${error.message}`);
      console.error("Form submission error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-900 to-cyan-700">
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
              <button className="text-gray-600 hover:text-cyan-500 transition-colors">
                Features
              </button>
              <button className="text-gray-600 hover:text-cyan-500 transition-colors">
                Pricing
              </button>
              <button className="bg-cyan-500 text-white px-6 py-2 rounded-lg hover:bg-cyan-600 transition-colors">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="p-6 pt-24">
        <div className="max-w-7xl mx-auto relative">
          <div className="absolute top-0 left-0 w-72 h-72 bg-cyan-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="text-center mb-12 bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20">
            <h1 className="text-4xl font-bold text-white font-roboto mb-4">
              Newsletter For You
            </h1>
            <p className="text-cyan-100 text-lg mb-4">
              Discover the best newsletter for your interest
            </p>
            <p className="text-cyan-100 text-lg mb-8">
              List your newsletter on our Newsletterfy Directory and get
              discovered to get targeted subscribers on autopilot.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-white text-cyan-500 px-8 py-3 rounded-lg text-lg font-bold hover:bg-cyan-50 transition-colors"
            >
              Get Started
            </button>
          </div>
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-6 mb-8 border border-cyan-800">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="w-full md:w-1/3">
                <input
                  type="text"
                  name="search"
                  placeholder="Search newsletters..."
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                name="category"
                className="w-full md:w-1/4 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <select
                name="subscribers"
                className="w-full md:w-1/4 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                value={selectedSubscriberRange}
                onChange={(e) => setSelectedSubscriberRange(e.target.value)}
              >
                <option value="all">All Subscriber Counts</option>
                {subscriberRanges.map((range) => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="featured-section mb-12">
            <h2 className="text-2xl font-bold mb-6 font-roboto text-white">
              Featured Newsletters
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNewsletters
                .filter((n) => n.featured)
                .map((newsletter) => (
                  <div
                    key={newsletter.id}
                    className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden border-2 border-cyan-500"
                  >
                    <div className="relative">
                      {!imageError[newsletter.id] ? (
                        <img
                          src={newsletter.image}
                          alt={`Cover image for ${newsletter.name}`}
                          className="w-full h-48 object-cover"
                          onError={() => handleImageError(newsletter.id)}
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                          <i className="fas fa-image text-gray-400 text-4xl"></i>
                        </div>
                      )}
                      <span className="absolute top-4 right-4 bg-yellow-400 text-black px-3 py-1 rounded-full text-sm font-semibold">
                        <i className="fas fa-star mr-1"></i>Featured
                      </span>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-2 font-roboto">
                        {newsletter.name}
                      </h3>
                      <p className="text-gray-600 mb-4 font-crimson-text">
                        {newsletter.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="bg-cyan-100 text-cyan-800 px-3 py-1 rounded-full text-sm">
                          {newsletter.category}
                        </span>
                        <span className="text-gray-600 text-sm">
                          <i className="fas fa-users mr-1"></i>
                          {newsletter.subscriber_count?.toLocaleString() ||
                            0}{" "}
                          subscribers
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
              {error}
            </div>
          )}

          <div className="all-newsletters">
            <h2 className="text-2xl font-bold mb-6 font-roboto text-white">
              All Newsletters
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNewsletters
                .filter((n) => !n.featured)
                .map((newsletter) => (
                  <div
                    key={newsletter.id}
                    className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden border border-cyan-800"
                  >
                    <div className="relative">
                      {!imageError[newsletter.id] ? (
                        <img
                          src={newsletter.image}
                          alt={`Cover image for ${newsletter.name}`}
                          className="w-full h-48 object-cover"
                          onError={() => handleImageError(newsletter.id)}
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                          <i className="fas fa-image text-gray-400 text-4xl"></i>
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-2 font-roboto">
                        {newsletter.name}
                      </h3>
                      <p className="text-gray-600 mb-4 font-crimson-text">
                        {newsletter.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="bg-cyan-100 text-cyan-800 px-3 py-1 rounded-full text-sm">
                          {newsletter.category}
                        </span>
                        <span className="text-gray-600 text-sm">
                          <i className="fas fa-users mr-1"></i>
                          {newsletter.subscriber_count?.toLocaleString() ||
                            0}{" "}
                          subscribers
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
          <div className="text-center mt-16 bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Grow Your Newsletter?
            </h2>
            <p className="text-cyan-100 text-lg mb-8">
              List your newsletter on our Newsletterfy Directory and get
              discovered to get targeted subscribers on autopilot.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-white text-cyan-500 px-8 py-3 rounded-lg text-lg font-bold hover:bg-cyan-50 transition-colors"
            >
              Get Started
            </button>
          </div>

          {isModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">
                    Submit Your Newsletter
                  </h3>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="floating-input-container">
                    <input
                      type="text"
                      id="newsletter-name"
                      name="name"
                      required
                      className="floating-input"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder=" "
                    />
                    <label htmlFor="newsletter-name" className="floating-label">Newsletter Name</label>
                  </div>

                  <div className="floating-input-container">
                    <textarea
                      id="newsletter-description"
                      name="description"
                      required
                      className="floating-input floating-textarea"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      placeholder=" "
                      rows={4}
                    />
                    <label htmlFor="newsletter-description" className="floating-label">Description</label>
                  </div>

                  <div className="floating-input-container">
                    <input
                      type="url"
                      id="newsletter-url"
                      name="url"
                      required
                      className="floating-input"
                      value={formData.url}
                      onChange={(e) =>
                        setFormData({ ...formData, url: e.target.value })
                      }
                      placeholder=" "
                    />
                    <label htmlFor="newsletter-url" className="floating-label">Newsletter URL</label>
                  </div>

                  <div className="floating-input-container">
                    <select
                      id="newsletter-category"
                      name="category"
                      required
                      className="floating-input modern-select"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      placeholder=" "
                    >
                      <option value="">Select a category</option>
                      <option value="Technology">Technology</option>
                      <option value="Finance">Finance</option>
                      <option value="Health">Health</option>
                      <option value="Lifestyle">Lifestyle</option>
                      <option value="Business">Business</option>
                      <option value="Education">Education</option>
                    </select>
                    <label htmlFor="newsletter-category" className="floating-label">Category</label>
                  </div>

                  <button
                    type="submit"
                    disabled={uploading}
                    className="w-full px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {uploading ? "Submitting..." : "Submit Newsletter"}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MainComponent;