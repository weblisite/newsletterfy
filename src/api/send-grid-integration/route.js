async function handler({ action, data }) {
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
  const SENDGRID_API_URL = "https://api.sendgrid.com/v3";

  const sendRequest = async (endpoint, method = "GET", body = null) => {
    if (!SENDGRID_API_KEY) {
      throw new Error("SendGrid API key not configured");
    }

    const options = {
      method,
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
    };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${SENDGRID_API_URL}${endpoint}`, options);
    if (!response.ok) {
      throw new Error(`SendGrid API error: ${response.statusText}`);
    }
    return response.json();
  };

  if (action === "testConnection") {
    try {
      const response = await sendRequest("/user/profile");
      return {
        success: true,
        message: "Successfully connected to SendGrid",
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: `SendGrid connection test failed: ${error.message}`,
      };
    }
  }

  const { tab, newsletterId, period, startDate, endDate, isAdmin } = data;

  const fetchAdminTabData = async (tabName) => {
    const adminTabActions = {
      overview: async () => {
        return {
          platform_metrics: await sendRequest("/admin/dashboard", "GET", {
            start_date: startDate,
            end_date: endDate,
            metrics: [
              "total_emails",
              "opens",
              "clicks",
              "bounces",
              "spam_reports",
              "unsubscribes",
            ],
          }),
          active_users: await sendRequest("/admin/users/active", "GET", {
            period,
          }),
          system_health: await sendRequest("/admin/system/health", "GET", {
            include: [
              "delivery_success_rate",
              "bounce_rate",
              "spam_complaint_rate",
              "domain_reputation",
            ],
          }),
          revenue_overview: await sendRequest("/admin/revenue/summary", "GET", {
            period,
          }),
        };
      },

      users: async () => {
        return {
          all_users: await sendRequest("/admin/users", "GET", {
            include: ["usage_metrics", "engagement_stats", "revenue_generated"],
          }),
          top_performers: await sendRequest("/admin/users/top", "GET", {
            period,
            metrics: ["engagement", "revenue", "growth"],
          }),
          at_risk: await sendRequest("/admin/users/risk", "GET", {
            include: ["high_bounce_rate", "spam_complaints", "inactive"],
          }),
        };
      },

      newsletters: async () => {
        return {
          all_newsletters: await sendRequest("/admin/newsletters", "GET", {
            include: ["performance_metrics", "subscriber_count", "revenue"],
          }),
          top_newsletters: await sendRequest("/admin/newsletters/top", "GET", {
            period,
            metrics: ["engagement", "growth", "revenue"],
          }),
          content_analysis: await sendRequest(
            "/admin/newsletters/content",
            "GET",
            {
              include: ["popular_topics", "engagement_patterns"],
            }
          ),
        };
      },

      monetization: async () => {
        return {
          revenue_streams: await sendRequest("/admin/revenue/streams", "GET", {
            period,
            include: ["subscriptions", "sponsored_ads", "tips", "products"],
          }),
          payouts: await sendRequest("/admin/payouts", "GET", {
            status: ["pending", "processed"],
            period,
          }),
          affiliate_program: await sendRequest(
            "/admin/affiliate/overview",
            "GET",
            {
              include: ["active_affiliates", "earnings", "conversions"],
            }
          ),
        };
      },

      system: async () => {
        return {
          email_delivery: await sendRequest("/admin/system/delivery", "GET", {
            include: ["success_rate", "bounce_rate", "spam_rate"],
          }),
          domain_health: await sendRequest("/admin/system/domains", "GET", {
            include: ["reputation_scores", "authentication_status"],
          }),
          api_usage: await sendRequest("/admin/system/api", "GET", {
            include: ["requests", "errors", "latency"],
          }),
        };
      },

      compliance: async () => {
        return {
          spam_reports: await sendRequest("/admin/compliance/spam", "GET", {
            period,
          }),
          gdpr_requests: await sendRequest("/admin/compliance/gdpr", "GET", {
            status: ["pending", "processed"],
          }),
          blocked_users: await sendRequest("/admin/compliance/blocked", "GET", {
            include: ["reason", "date", "details"],
          }),
        };
      },

      billing: async () => {
        return {
          subscriptions: await sendRequest(
            "/admin/billing/subscriptions",
            "GET",
            {
              include: ["active", "canceled", "expired"],
            }
          ),
          revenue: await sendRequest("/admin/billing/revenue", "GET", {
            period,
            include: ["mrr", "arr", "churn_rate"],
          }),
          transactions: await sendRequest(
            "/admin/billing/transactions",
            "GET",
            {
              period,
              status: ["successful", "failed", "refunded"],
            }
          ),
        };
      },
    };

    return adminTabActions[tabName]?.() || null;
  };

  const fetchUserTabData = async (tabName) => {
    const tabActions = {
      overview: async () => {
        return {
          metrics: await sendRequest(
            `/user/newsletters/${newsletterId}/metrics`,
            "GET",
            {
              period,
              include: [
                "total_sent",
                "open_rate",
                "click_rate",
                "bounce_rate",
                "spam_complaints",
              ],
            }
          ),
          trends: await sendRequest(
            `/user/newsletters/${newsletterId}/engagement`,
            "GET",
            {
              start_date: startDate,
              end_date: endDate,
              metrics: ["opens", "clicks", "engagement_score"],
            }
          ),
          growth: await sendRequest(
            `/user/newsletters/${newsletterId}/list/growth`,
            "GET",
            {
              period,
              include: ["new_subscribers", "unsubscribes", "net_growth"],
            }
          ),
          realtime: await sendRequest("/messages/stats", "GET", {
            query: `newsletter_id = '${newsletterId}'`,
            limit: 100,
          }),
        };
      },

      subscribers: async () => {
        return {
          activity: await sendRequest(
            `/user/newsletters/${newsletterId}/subscribers/activity`,
            "GET",
            {
              include: [
                "active_subscribers",
                "inactive_subscribers",
                "engagement_segments",
              ],
            }
          ),
          demographics: await sendRequest(
            `/user/newsletters/${newsletterId}/subscribers/demographics`,
            "GET",
            {
              include: ["locations", "engagement_times", "client_types"],
            }
          ),
          inactive: await sendRequest("/marketing/contacts/search", "POST", {
            query: `last_engaged < '30 days ago' AND list_ids CONTAINS '${newsletterId}'`,
          }),
          lifetime_value: await sendRequest(
            `/analytics/subscribers/${newsletterId}/ltv`
          ),
        };
      },

      campaigns: async () => {
        return {
          performance: await sendRequest(
            `/user/newsletters/${newsletterId}/campaigns/${data.campaignId}`,
            "GET",
            {
              include: ["delivery_metrics", "engagement_metrics", "top_links"],
            }
          ),
          top_content: await sendRequest(
            `/user/newsletters/${newsletterId}/content/performance`,
            "GET",
            {
              period,
              include: ["top_links", "popular_sections", "best_ctrs"],
            }
          ),
          scheduled: await sendRequest(
            `/user/newsletters/${newsletterId}/scheduled`,
            "GET",
            {
              include: [
                "pending_campaigns",
                "scheduled_time",
                "estimated_audience",
              ],
            }
          ),
          delivery: await sendRequest(
            `/user/newsletters/${newsletterId}/delivery/${data.campaignId}`,
            "GET",
            {
              include: ["delivery_time", "inbox_placement", "delivery_issues"],
            }
          ),
        };
      },

      templates: async () => {
        return {
          list: await sendRequest("/templates"),
          insights: await sendRequest(
            `/user/newsletters/${newsletterId}/templates/performance`,
            "GET",
            {
              include: [
                "template_stats",
                "engagement_by_template",
                "best_performing",
              ],
            }
          ),
          performance: await sendRequest(
            `/templates/${data.templateId}/stats`,
            "GET",
            {
              start_date: startDate,
              end_date: endDate,
            }
          ),
        };
      },

      analytics: async () => {
        return {
          performance: await sendRequest(`/stats/user/${newsletterId}`, "GET", {
            start_date: startDate,
            end_date: endDate,
            aggregated_by: "day",
          }),
          unsubscribes: await sendRequest(
            `/user/newsletters/${newsletterId}/unsubscribes`,
            "GET",
            {
              period,
              include: ["unsubscribe_rate", "reasons", "trends"],
            }
          ),
          validation: await sendRequest(
            `/user/newsletters/${newsletterId}/validation`,
            "GET",
            {
              include: ["valid_emails", "risky_emails", "invalid_emails"],
            }
          ),
          list_health: await sendRequest(
            `/marketing/lists/${newsletterId}/health`,
            "GET",
            {
              period,
            }
          ),
        };
      },

      monetization: async () => {
        return {
          revenue: await sendRequest(
            `/analytics/revenue/${newsletterId}`,
            "GET",
            {
              start_date: startDate,
              end_date: endDate,
            }
          ),
          sponsored_ads: await sendRequest(
            `/monetization/sponsored-ads/${data.adId}/metrics`
          ),
          affiliate: await sendRequest(
            `/monetization/affiliate/earnings/${newsletterId}`,
            "GET",
            {
              start_date: startDate,
              end_date: endDate,
            }
          ),
        };
      },

      growth: async () => {
        return {
          stats: await sendRequest(
            `/analytics/growth/${newsletterId}?period=${period}`
          ),
          engagement: await sendRequest(
            `/analytics/engagement/${newsletterId}`
          ),
        };
      },

      settings: async () => {
        return {
          reputation: await sendRequest("/sender-reputation"),
          auth_status: await sendRequest("/whitelabel/domains/status"),
          usage: await sendRequest(`/usage/stats/${newsletterId}`, "GET", {
            period,
          }),
        };
      },
    };

    return tabActions[tabName]?.() || null;
  };

  try {
    const tabData = isAdmin
      ? await fetchAdminTabData(tab)
      : await fetchUserTabData(tab);

    return {
      success: true,
      data: tabData,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}