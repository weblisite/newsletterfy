import { NextResponse } from 'next/server';

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map();
const suspiciousActivityStore = new Map();

// Rate limit configurations
const RATE_LIMITS = {
  donation: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxAttempts: 5, // 5 donations per 15 minutes
    blockDuration: 60 * 60 * 1000 // 1 hour block
  },
  recurring: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxAttempts: 3, // 3 recurring donation attempts per hour
    blockDuration: 24 * 60 * 60 * 1000 // 24 hour block
  },
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxAttempts: 60, // 60 API calls per minute
    blockDuration: 5 * 60 * 1000 // 5 minute block
  }
};

// Fraud detection patterns
const FRAUD_PATTERNS = {
  rapidSuccession: {
    timeWindow: 5 * 60 * 1000, // 5 minutes
    maxDonations: 3,
    suspicionScore: 50
  },
  unusualAmount: {
    maxAmount: 10000, // $10,000
    minAmount: 0.01,
    suspicionScore: 30
  },
  duplicateEmail: {
    timeWindow: 24 * 60 * 60 * 1000, // 24 hours
    maxDonations: 10,
    suspicionScore: 40
  },
  suspiciousMessage: {
    patterns: [
      /test|testing|fake|spam|scam/i,
      /\b(credit\s*card|cc|cvv|ssn)\b/i,
      /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/ // Credit card pattern
    ],
    suspicionScore: 70
  }
};

export class RateLimiter {
  static getKey(identifier, type) {
    return `${type}:${identifier}`;
  }

  static isRateLimited(identifier, type) {
    const key = this.getKey(identifier, type);
    const config = RATE_LIMITS[type] || RATE_LIMITS.api;
    const now = Date.now();
    
    // Get or create rate limit data
    if (!rateLimitStore.has(key)) {
      rateLimitStore.set(key, {
        count: 0,
        windowStart: now,
        blocked: false,
        blockUntil: 0
      });
    }

    const data = rateLimitStore.get(key);

    // Check if currently blocked
    if (data.blocked && now < data.blockUntil) {
      return {
        limited: true,
        retryAfter: Math.ceil((data.blockUntil - now) / 1000),
        reason: 'Rate limit exceeded'
      };
    }

    // Reset window if expired
    if (now - data.windowStart > config.windowMs) {
      data.count = 0;
      data.windowStart = now;
      data.blocked = false;
    }

    // Increment counter
    data.count++;

    // Check if limit exceeded
    if (data.count > config.maxAttempts) {
      data.blocked = true;
      data.blockUntil = now + config.blockDuration;
      
      return {
        limited: true,
        retryAfter: Math.ceil(config.blockDuration / 1000),
        reason: 'Rate limit exceeded'
      };
    }

    return {
      limited: false,
      remaining: config.maxAttempts - data.count,
      resetTime: data.windowStart + config.windowMs
    };
  }

  static recordAttempt(identifier, type) {
    const result = this.isRateLimited(identifier, type);
    return result;
  }
}

export class FraudDetector {
  static calculateSuspicionScore(donationData, userHistory = []) {
    let score = 0;
    const flags = [];

    // Check rapid succession
    const recentDonations = userHistory.filter(d => 
      Date.now() - new Date(d.created_at).getTime() < FRAUD_PATTERNS.rapidSuccession.timeWindow
    );
    
    if (recentDonations.length >= FRAUD_PATTERNS.rapidSuccession.maxDonations) {
      score += FRAUD_PATTERNS.rapidSuccession.suspicionScore;
      flags.push('rapid_succession');
    }

    // Check unusual amounts
    const amount = parseFloat(donationData.amount);
    if (amount > FRAUD_PATTERNS.unusualAmount.maxAmount || amount < FRAUD_PATTERNS.unusualAmount.minAmount) {
      score += FRAUD_PATTERNS.unusualAmount.suspicionScore;
      flags.push('unusual_amount');
    }

    // Check duplicate email frequency
    const emailDonations = userHistory.filter(d => 
      d.metadata?.donor_email === donationData.donor_email &&
      Date.now() - new Date(d.created_at).getTime() < FRAUD_PATTERNS.duplicateEmail.timeWindow
    );
    
    if (emailDonations.length >= FRAUD_PATTERNS.duplicateEmail.maxDonations) {
      score += FRAUD_PATTERNS.duplicateEmail.suspicionScore;
      flags.push('duplicate_email');
    }

    // Check suspicious message content
    if (donationData.message) {
      for (const pattern of FRAUD_PATTERNS.suspiciousMessage.patterns) {
        if (pattern.test(donationData.message)) {
          score += FRAUD_PATTERNS.suspiciousMessage.suspicionScore;
          flags.push('suspicious_message');
          break;
        }
      }
    }

    // Additional checks
    
    // Check for bot-like behavior (very fast form submission)
    if (donationData.formSubmissionTime && donationData.formSubmissionTime < 3000) { // Less than 3 seconds
      score += 20;
      flags.push('rapid_form_submission');
    }

    // Check for suspicious user agent patterns
    if (donationData.userAgent) {
      const suspiciousAgents = [
        /bot|crawler|spider|scraper/i,
        /curl|wget|python|php/i
      ];
      
      for (const pattern of suspiciousAgents) {
        if (pattern.test(donationData.userAgent)) {
          score += 30;
          flags.push('suspicious_user_agent');
          break;
        }
      }
    }

    return {
      score,
      flags,
      riskLevel: this.getRiskLevel(score),
      shouldBlock: score >= 80,
      shouldReview: score >= 50
    };
  }

  static getRiskLevel(score) {
    if (score >= 80) return 'high';
    if (score >= 50) return 'medium';
    if (score >= 20) return 'low';
    return 'minimal';
  }

  static recordSuspiciousActivity(identifier, activity) {
    const key = `suspicious:${identifier}`;
    const now = Date.now();
    
    if (!suspiciousActivityStore.has(key)) {
      suspiciousActivityStore.set(key, []);
    }
    
    const activities = suspiciousActivityStore.get(key);
    activities.push({
      ...activity,
      timestamp: now
    });
    
    // Keep only recent activities (last 24 hours)
    const filtered = activities.filter(a => now - a.timestamp < 24 * 60 * 60 * 1000);
    suspiciousActivityStore.set(key, filtered);
    
    return filtered;
  }
}

export function withRateLimit(handler, options = {}) {
  return async (req, ...args) => {
    try {
      const { type = 'api', getIdentifier } = options;
      
      // Get identifier (IP address, user ID, email, etc.)
      let identifier;
      if (getIdentifier) {
        identifier = await getIdentifier(req);
      } else {
        // Default to IP address
        identifier = req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') || 
                    req.ip || 
                    'unknown';
      }

      // Check rate limit
      const rateLimitResult = RateLimiter.recordAttempt(identifier, type);
      
      if (rateLimitResult.limited) {
        return NextResponse.json(
          { 
            error: 'Rate limit exceeded',
            retryAfter: rateLimitResult.retryAfter,
            reason: rateLimitResult.reason
          },
          { 
            status: 429,
            headers: {
              'Retry-After': rateLimitResult.retryAfter.toString(),
              'X-RateLimit-Limit': RATE_LIMITS[type].maxAttempts.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': Math.ceil(Date.now() / 1000 + rateLimitResult.retryAfter).toString()
            }
          }
        );
      }

      // Add rate limit headers to response
      const response = await handler(req, ...args);
      
      if (response instanceof NextResponse) {
        response.headers.set('X-RateLimit-Limit', RATE_LIMITS[type].maxAttempts.toString());
        response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
        response.headers.set('X-RateLimit-Reset', Math.ceil(rateLimitResult.resetTime / 1000).toString());
      }

      return response;
    } catch (error) {
      console.error('Rate limiting error:', error);
      return handler(req, ...args); // Continue without rate limiting on error
    }
  };
}

export function withFraudDetection(handler, options = {}) {
  return async (req, ...args) => {
    try {
      if (req.method !== 'POST') {
        return handler(req, ...args);
      }

      const body = await req.json();
      const { getDonationHistory, getIdentifier } = options;
      
      // Get identifier for fraud detection
      let identifier;
      if (getIdentifier) {
        identifier = await getIdentifier(req, body);
      } else {
        identifier = body.donor_email || req.headers.get('x-forwarded-for') || 'unknown';
      }

      // Get donation history for this identifier
      let history = [];
      if (getDonationHistory) {
        history = await getDonationHistory(identifier);
      }

      // Analyze for fraud
      const fraudAnalysis = FraudDetector.calculateSuspicionScore(body, history);
      
      // Block high-risk transactions
      if (fraudAnalysis.shouldBlock) {
        FraudDetector.recordSuspiciousActivity(identifier, {
          type: 'blocked_donation',
          score: fraudAnalysis.score,
          flags: fraudAnalysis.flags,
          donationData: body
        });

        return NextResponse.json(
          { 
            error: 'Transaction blocked for security reasons',
            reference: `FD-${Date.now()}` // Fraud detection reference
          },
          { status: 403 }
        );
      }

      // Flag for review but allow
      if (fraudAnalysis.shouldReview) {
        FraudDetector.recordSuspiciousActivity(identifier, {
          type: 'flagged_donation',
          score: fraudAnalysis.score,
          flags: fraudAnalysis.flags,
          donationData: body
        });

        // Add fraud detection headers
        const response = await handler(req, ...args);
        if (response instanceof NextResponse) {
          response.headers.set('X-Fraud-Score', fraudAnalysis.score.toString());
          response.headers.set('X-Fraud-Flags', fraudAnalysis.flags.join(','));
          response.headers.set('X-Risk-Level', fraudAnalysis.riskLevel);
        }
        return response;
      }

      return handler(req, ...args);
    } catch (error) {
      console.error('Fraud detection error:', error);
      return handler(req, ...args); // Continue without fraud detection on error
    }
  };
} 