"use client";
import React from "react";

function MainComponent() {
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

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
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-6 sm:p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 font-poppins">
            Privacy Policy
          </h1>
          <p className="text-gray-600 mb-6 font-inter">
            Effective Date: 23rd November 2024
          </p>

          <div className="prose prose-gray max-w-none space-y-6">
            <p className="text-gray-700 font-inter">
              At <span className="font-semibold">Newsletterfy</span>, your
              privacy is important to us. This Privacy Policy explains how we
              collect, use, share, and protect your personal information when
              you use our platform ("Platform") to create, manage, and
              distribute newsletters.
            </p>

            <div className="mt-6">
              <h2 className="text-xl font-semibold text-gray-900 font-poppins mb-4">
                1. Information We Collect
              </h2>
              <h3 className="font-medium text-lg">
                a. Information You Provide Directly
              </h3>
              <ul className="list-disc pl-5 space-y-2 mb-4">
                <li>
                  Account Information: When you sign up, we collect your name,
                  email address, password, and other profile information.
                </li>
                <li>
                  Payment Information: If you subscribe to a paid plan, we
                  collect payment details.
                </li>
                <li>
                  Content: We collect and store the newsletters, images, and
                  other materials you upload.
                </li>
              </ul>
              <h3 className="font-medium text-lg">
                b. Information We Collect Automatically
              </h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Usage Data: Information about how you use the Platform.</li>
                <li>
                  Device Information: Data about the device you use to access
                  the Platform.
                </li>
                <li>
                  Cookies and Tracking Technologies: We use cookies and similar
                  technologies.
                </li>
              </ul>
            </div>

            <div className="mt-6">
              <h2 className="text-xl font-semibold text-gray-900 font-poppins mb-4">
                2. How We Use Your Information
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Provide, operate, and improve the Platform.</li>
                <li>
                  Facilitate the creation, management, and distribution of
                  newsletters.
                </li>
                <li>Process payments and manage billing.</li>
                <li>Communicate with you.</li>
                <li>
                  Monitor Platform usage and prevent unauthorized activity.
                </li>
              </ul>
            </div>

            <div className="mt-6">
              <h2 className="text-xl font-semibold text-gray-900 font-poppins mb-4">
                3. How We Share Your Information
              </h2>
              <p>
                We do not sell your personal information. However, we may share
                it in the following ways:
              </p>
              <h3 className="font-medium text-lg mt-4">
                a. With Service Providers
              </h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Email Delivery: Providers like SendGrid</li>
                <li>
                  Payment Processing: Providers like Paystack, Lemon Squeezy,
                  Paddle
                </li>
                <li>Analytics: Tools like Google Analytics</li>
              </ul>
            </div>

            <div className="mt-6">
              <h2 className="text-xl font-semibold text-gray-900 font-poppins mb-4">
                4. Your Rights and Choices
              </h2>
              <p>
                You can access, update, or delete your personal information in
                your account settings.
              </p>
            </div>

            <div className="mt-6">
              <h2 className="text-xl font-semibold text-gray-900 font-poppins mb-4">
                5. Data Retention
              </h2>
              <p>
                We retain your information as long as necessary to provide our
                services.
              </p>
            </div>
            <div className="mt-6">
              <h2 className="text-xl font-semibold text-gray-900 font-poppins mb-4">
                6. Security
              </h2>
              <p>
                We take security seriously and implement appropriate technical
                measures.
              </p>
            </div>
            <div className="mt-6">
              <h2 className="text-xl font-semibold text-gray-900 font-poppins mb-4">
                7. International Data Transfers
              </h2>
              <p>
                Your information may be transferred to and processed in
                different countries.
              </p>
            </div>

            <div className="mt-6">
              <h2 className="text-xl font-semibold text-gray-900 font-poppins mb-4">
                8. Children's Privacy
              </h2>
              <p>Newsletterfy is not intended for use by children under 13.</p>
            </div>

            <div className="mt-6">
              <h2 className="text-xl font-semibold text-gray-900 font-poppins mb-4">
                9. Updates to This Privacy Policy
              </h2>
              <p>We may update this Privacy Policy periodically.</p>
            </div>
            <div className="mt-6">
              <h2 className="text-xl font-semibold text-gray-900 font-poppins mb-4">
                10. Contact Us
              </h2>
              <p>If you have questions or concerns, please contact us:</p>
              <p className="mt-2">
                Email:{" "}
                <a
                  href="mailto:support@newsletterfy.com"
                  className="text-blue-600 hover:text-blue-800"
                >
                  support@newsletterfy.com
                </a>
              </p>
            </div>
            <p className="mt-8 text-gray-600 text-center font-inter">
              By using Newsletterfy, you acknowledge and agree to this Privacy
              Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainComponent;