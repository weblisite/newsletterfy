"use client";
import React from "react";

function MainComponent() {
  const [apiKey, setApiKey] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [success, setSuccess] = React.useState(null);
  const [step, setStep] = React.useState(1);
  const [dnsVerified, setDnsVerified] = React.useState(false);
  const [rateLimitRemaining, setRateLimitRemaining] = React.useState(null);
  const [rateLimitReset, setRateLimitReset] = React.useState(null);
  const [subscriberLists, setSubscriberLists] = React.useState([]);
  const [testEmailAddress, setTestEmailAddress] = React.useState("");
  const [dnsStatus, setDnsStatus] = React.useState({ spf: false, dkim: false });
  const [lastApiCall, setLastApiCall] = React.useState(null);
  const checkRateLimit = (headers) => {
    const remaining = headers.get("X-RateLimit-Remaining");
    const reset = headers.get("X-RateLimit-Reset");
    const now = Date.now();

    if (remaining) setRateLimitRemaining(parseInt(remaining));
    if (reset) setRateLimitReset(new Date(parseInt(reset) * 1000));

    if (lastApiCall && now - lastApiCall < 1000) {
      throw new Error("Please wait before making another request");
    }
    setLastApiCall(now);

    return remaining > 0;
  };
  const verifyDomain = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const response = await retryWithBackoff(async () => {
        const response = await fetch("/api/send-grid-integration", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "verifyDomain",
            data: { domain: "mail.newsletterfy.com" },
          }),
        });

        if (!response.ok) {
          const errorMessage = await handleApiError(response);
          if (errorMessage.includes("domain_exists")) {
            throw new Error("Domain is already verified by another account");
          }
          throw new Error(errorMessage);
        }

        if (!checkRateLimit(response.headers)) {
          throw new Error("Rate limit exceeded. Please try again later.");
        }

        return response;
      }, 5);

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to verify domain");
      }

      setDnsStatus(data.dnsStatus);
      if (data.dnsStatus.spf && data.dnsStatus.dkim) {
        setDnsVerified(true);
        setSuccess("Domain verified successfully");
      } else {
        setError(
          "DNS records not fully propagated. This can take up to 48 hours. Please try again later."
        );
      }
    } catch (err) {
      setError(err.message);
      if (err.message.includes("domain_exists")) {
        setStep(1);
      }
    } finally {
      setLoading(false);
    }
  };
  const validateApiKey = (key) => {
    if (!key) return false;
    if (!key.startsWith("SG.")) return false;
    if (key.length < 50) return false;
    if (!/^SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}$/.test(key)) return false;
    return true;
  };
  const createSubscriberList = async (name, description) => {
    if (loading) return;
    setLoading(true);

    try {
      const response = await retryWithBackoff(async () => {
        const response = await fetch("/api/send-grid-integration", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "createSubscriberList",
            data: { name, description },
          }),
        });

        if (!response.ok) {
          const errorMessage = await handleApiError(response);
          throw new Error(errorMessage);
        }

        if (!checkRateLimit(response.headers)) {
          throw new Error("Rate limit exceeded. Please try again later.");
        }

        return response;
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to create list");
      }

      setSubscriberLists((prev) => [...prev, data]);
      setSuccess("List created successfully");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleParentSetup = async () => {
    if (loading) return;
    if (!apiKey) {
      setError("Please enter your SendGrid API key");
      return;
    }
    if (!validateApiKey(apiKey)) {
      setError("Invalid SendGrid API key format. Please check your API key.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const response = await retryWithBackoff(async () => {
        const response = await fetch("/api/send-grid-integration", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "setup",
            data: { apiKey },
          }),
        });

        if (!response.ok) {
          const errorMessage = await handleApiError(response);
          if (errorMessage.includes("invalid_key")) {
            throw new Error(
              "Invalid API key. Please check your SendGrid API key."
            );
          } else if (errorMessage.includes("permissions")) {
            throw new Error(
              "API key doesn't have required permissions. Required: Mail Send, API Keys, Domain Authentication"
            );
          }
          throw new Error(errorMessage);
        }

        if (!checkRateLimit(response.headers)) {
          throw new Error("Rate limit exceeded. Please try again later.");
        }

        return response;
      }, 5);

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to configure email");
      }

      setStep(2);
      setSuccess(
        "Email configuration successful. Please proceed with domain verification."
      );
    } catch (err) {
      setError(err.message);
      if (err.message.includes("permissions")) {
        setStep(1);
      }
    } finally {
      setLoading(false);
    }
  };
  const handleSendTestEmail = async () => {
    if (loading) return;
    if (!testEmailAddress) {
      setError("Please enter a test email address");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/send-grid-integration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sendTestEmail",
          data: { to: testEmailAddress },
        }),
      });

      if (!response.ok) {
        const errorMessage = await handleApiError(response);
        throw new Error(errorMessage);
      }

      if (!checkRateLimit(response.headers)) {
        throw new Error("Rate limit exceeded. Please try again later.");
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to send test email");
      }

      setSuccess("Test email sent successfully!");
      setTestEmailAddress("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-lg fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <i className="fas fa-envelope-open-text text-2xl text-cyan-600 mr-2"></i>
              <span className="text-xl font-bold text-cyan-600">
                Newsletterfy
              </span>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              Email Configuration
            </h1>
            <p className="text-gray-600 mb-8">
              Set up your newsletter sending capabilities with our secure email
              integration
            </p>

            <div className="space-y-8">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Configure Email Settings
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      API Key
                    </label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-cyan-500"
                      placeholder="Enter your API key"
                    />
                  </div>
                  <div className="bg-cyan-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <i className="fas fa-info-circle text-cyan-500 mr-2"></i>
                      <span className="font-medium text-cyan-800">
                        Email Format
                      </span>
                    </div>
                    <p className="text-sm text-cyan-600">
                      Your newsletters will be sent from:
                      <code className="block mt-2 bg-white p-2 rounded">
                        newsletter-name@mail.newsletterfy.com
                      </code>
                    </p>
                  </div>
                  {dnsVerified && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Test Email Address
                      </label>
                      <input
                        type="email"
                        value={testEmailAddress}
                        onChange={(e) => setTestEmailAddress(e.target.value)}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-cyan-500"
                        placeholder="Enter email for testing"
                      />
                    </div>
                  )}
                  {step === 2 && !dnsVerified && (
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h3 className="font-medium text-yellow-800 mb-2">
                        DNS Records Required
                      </h3>
                      <div className="space-y-2">
                        <div className="bg-white p-2 rounded text-sm">
                          <p className="font-mono">
                            TXT mail.newsletterfy.com v=spf1
                            include:sendgrid.net ~all
                          </p>
                        </div>
                        <div className="bg-white p-2 rounded text-sm">
                          <p className="font-mono">
                            CNAME s1._domainkey.mail.newsletterfy.com
                            s1.domainkey.u17504312.wl180.sendgrid.net
                          </p>
                        </div>
                        <div className="bg-white p-2 rounded text-sm">
                          <p className="font-mono">
                            CNAME s2._domainkey.mail.newsletterfy.com
                            s2.domainkey.u17504312.wl180.sendgrid.net
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={verifyDomain}
                        className="mt-4 bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                      >
                        Verify DNS Records
                      </button>
                    </div>
                  )}
                  <button
                    onClick={handleParentSetup}
                    disabled={loading || !apiKey}
                    className="w-full bg-cyan-600 text-white px-6 py-3 rounded-lg hover:bg-cyan-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Setting up...
                      </span>
                    ) : (
                      "Configure Email"
                    )}
                  </button>
                  {dnsVerified && (
                    <button
                      onClick={handleSendTestEmail}
                      disabled={loading}
                      className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors mt-4"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center">
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                          Sending test email...
                        </span>
                      ) : (
                        "Send Test Email"
                      )}
                    </button>
                  )}
                </div>
              </div>

              {rateLimitRemaining !== null && rateLimitRemaining < 100 && (
                <div className="bg-yellow-50 text-yellow-700 p-4 rounded-lg flex items-center">
                  <i className="fas fa-exclamation-triangle mr-2"></i>
                  API rate limit low: {rateLimitRemaining} requests remaining.
                  Resets at {rateLimitReset?.toLocaleTimeString()}
                </div>
              )}

              {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center">
                  <i className="fas fa-exclamation-circle mr-2"></i>
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-center">
                  <i className="fas fa-check-circle mr-2"></i>
                  {success}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainComponent;