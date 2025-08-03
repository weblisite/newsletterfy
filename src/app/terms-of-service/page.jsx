"use client";
import React from "react";

function MainComponent() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-lg fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <i className="fas fa-envelope-open-text text-2xl text-blue-600 mr-2"></i>
              <span className="text-xl font-bold text-blue-600">
                Newsletterfy
              </span>
            </div>
          </div>
        </div>
      </nav>
      <div className="pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 font-crimson-text">
            Terms of Service
          </h1>
          <div className="text-sm text-gray-600 mb-8">
            Effective Date: 23rd November 2024
          </div>

          <div className="prose max-w-none">
            <p className="text-gray-700 mb-6">
              Welcome to Newsletterfy! These Terms of Service govern your use of
              the Newsletterfy platform and all related services, including the
              creation, management, and distribution of newsletters. By
              accessing or using Newsletterfy, you agree to comply with and be
              bound by these Terms.
            </p>

            <div className="space-y-8">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  1. Definitions
                </h2>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>
                    <strong>Platform:</strong> The Newsletterfy website, tools,
                    and services provided for creating, managing, and
                    distributing newsletters.
                  </li>
                  <li>
                    <strong>User:</strong> Any individual or entity that creates
                    an account and accesses or uses the Platform.
                  </li>
                  <li>
                    <strong>Subscriber:</strong> An individual who subscribes to
                    a newsletter created using the Platform.
                  </li>
                  <li>
                    <strong>Content:</strong> Any materials, including text,
                    images, videos, and other data, uploaded or distributed via
                    the Platform.
                  </li>
                </ul>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  2. Eligibility
                </h2>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>
                    Be at least 18 years old or have the legal authority to
                    enter into these Terms.
                  </li>
                  <li>
                    Provide accurate and complete registration information.
                  </li>
                  <li>
                    Use the Platform in compliance with applicable laws and
                    regulations.
                  </li>
                </ul>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  3. Account Responsibilities
                </h2>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>
                    You are responsible for maintaining the confidentiality of
                    your account credentials.
                  </li>
                  <li>
                    You are solely responsible for all activity under your
                    account.
                  </li>
                  <li>
                    Notify us immediately if you suspect unauthorized access to
                    your account.
                  </li>
                </ul>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  4. Acceptable Use
                </h2>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>
                    Comply with Anti-Spam Laws: Only send emails to subscribers
                    who have provided explicit consent to receive
                    communications.
                  </li>
                  <li>
                    Avoid Prohibited Content: Do not distribute content that is
                    unlawful, obscene, defamatory, threatening, or harmful.
                  </li>
                  <li>
                    Respect Intellectual Property: Ensure you have the rights or
                    licenses for all content you upload or distribute.
                  </li>
                  <li>
                    Avoid Abuse: Refrain from activities that harm the Platform
                    or its users, including attempts to hack, overload, or
                    exploit the Platform.
                  </li>
                </ul>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  5. Subscriptions and Payments
                </h2>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>
                    Free Plan: Certain features may be available at no cost.
                  </li>
                  <li>
                    Paid Plans: Additional features are available through
                    subscription-based plans. Fees are charged monthly or
                    annually based on your chosen plan.
                  </li>
                  <li>
                    Refund Policy: All payments are non-refundable unless
                    otherwise specified.
                  </li>
                </ul>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  6. Marketplace and Directory
                </h2>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>
                    Marketplace Listing Fee: Users pay a $25 fee to list a
                    newsletter for sale.
                  </li>
                  <li>
                    Broker Fee: Newsletterfy takes a 10% commission on
                    successful sales.
                  </li>
                  <li>
                    Compliance: Sellers must provide accurate details about
                    their newsletters and adhere to all applicable laws.
                  </li>
                </ul>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  7. Email Sending
                </h2>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>
                    Emails are sent using
                    [newslettername@mail.newsletterfy.com], leveraging
                    Newsletterfy’s authenticated domain. You can also use your
                    own sending domain.
                  </li>
                  <li>
                    You are responsible for ensuring compliance with all
                    relevant anti-spam laws, including CAN-SPAM and GDPR.
                  </li>
                  <li>
                    Newsletterfy reserves the right to monitor email activity to
                    ensure compliance and may suspend accounts for violations.
                  </li>
                </ul>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  8. Intellectual Property
                </h2>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>
                    Ownership: You retain ownership of the content you upload to
                    the Platform.
                  </li>
                  <li>
                    License to Use: By uploading content, you grant Newsletterfy
                    a non-exclusive, worldwide, royalty-free license to use it
                    for providing the Platform’s services.
                  </li>
                  <li>
                    Trademarks: The Newsletterfy name, logo, and related assets
                    are protected trademarks. You may not use them without
                    explicit permission.
                  </li>
                </ul>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  9. Privacy
                </h2>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>
                    Our use of your personal data is governed by the Privacy
                    Policy. By using the Platform, you agree to the terms of the
                    Privacy Policy.
                  </li>
                  <li>
                    You are responsible for protecting the privacy of your
                    subscribers and complying with data protection regulations.
                  </li>
                </ul>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  10. Termination
                </h2>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>
                    By You: You may cancel your account at any time through your
                    dashboard.
                  </li>
                  <li>
                    By Us: We may suspend or terminate your account if you
                    violate these Terms or engage in unlawful activity.
                  </li>
                  <li>
                    Effect of Termination: Upon termination, access to your
                    account and content may be disabled.
                  </li>
                </ul>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  11. Limitation of Liability
                </h2>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>To the fullest extent permitted by law:</li>
                  <li>
                    Newsletterfy shall not be liable for indirect, incidental,
                    or consequential damages arising from your use of the
                    Platform.
                  </li>
                  <li>
                    Total liability shall not exceed the amount paid by you in
                    the last 12 months for subscription services.
                  </li>
                </ul>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  12. Indemnification
                </h2>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>
                    You agree to indemnify and hold Newsletterfy harmless from
                    any claims, damages, or losses arising from your use of the
                    Platform or your violation of these Terms.
                  </li>
                </ul>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  13. Modifications
                </h2>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>We may update these Terms at any time.</li>
                  <li>
                    You will be notified of significant changes via email or
                    through the Platform. Continued use after such changes
                    constitutes acceptance.
                  </li>
                </ul>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  14. Governing Law
                </h2>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>
                    These Terms are governed by the laws of Kenya, without
                    regard to its conflict of law principles.
                  </li>
                </ul>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  15. Contact
                </h2>
                <div className="text-gray-700">
                  <p>For questions or concerns, please contact us at:</p>
                  <p className="mt-2">Email: support@newsletterfy.com</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center text-gray-600 text-sm">
            By using Newsletterfy, you agree to these Terms of Service.
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainComponent;