import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";
import { Button } from "@/components/ui/button";

// CHATGPT PROMPT TO GENERATE YOUR PRIVACY POLICY — replace with your own data 👇

// 1. Go to https://chat.openai.com/
// 2. Copy paste bellow
// 3. Replace the data with your own (if needed)
// 4. Paste the answer from ChatGPT directly in the <pre> tag below

// You are an excellent lawyer.

// I need your help to write a simple privacy policy for my website. Here is some context:
// - Website: https://resumepair.com
// - Name: ResumePair
// - Description: An AI-powered resume and cover letter builder helping users create ATS-optimized documents
// - User data collected: name, email, payment information, and resume/cover letter content
// - Non-personal data collection: web cookies
// - Purpose of Data Collection: Service delivery, document generation, and order processing
// - Data sharing: we do not share the data with any other parties except AI service providers for document generation
// - Children's Privacy: we do not collect any data from children
// - Updates to the Privacy Policy: users will be updated by email
// - Contact information: support@resumepair.com

// Please write a simple privacy policy for my site. Add the current date.  Do not add or explain your reasoning. Answer:

export const metadata = getSEOTags({
  title: `Privacy Policy | ${config.appName}`,
  canonicalUrlRelative: "/privacy-policy",
});

const PrivacyPolicy = () => {
  return (
    <main className="max-w-xl mx-auto">
      <div className="p-5">
        <Button variant="ghost" asChild>
          <Link href="/">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path
                fillRule="evenodd"
                d="M15 10a.75.75 0 01-.75.75H7.612l2.158 1.96a.75.75 0 11-1.04 1.08l-3.5-3.25a.75.75 0 010-1.08l3.5-3.25a.75.75 0 111.04 1.08L7.612 9.25h6.638A.75.75 0 0115 10z"
                clipRule="evenodd"
              />
            </svg>
            Back
          </Link>
        </Button>
        <h1 className="text-3xl font-extrabold pb-6">
          Privacy Policy for {config.appName}
        </h1>

        <pre className="leading-relaxed whitespace-pre-wrap font-sans">
          {`Last Updated: September 30, 2025

Thank you for visiting ResumePair ("we," "us," or "our"). This Privacy Policy outlines how we collect, use, and protect your personal and non-personal information when you use our website located at https://resumepair.com (the "Website").

By accessing or using the Website, you agree to the terms of this Privacy Policy. If you do not agree with the practices described in this policy, please do not use the Website.

1. Information We Collect

1.1 Personal Data

We collect the following personal information from you:

Name: We collect your name to personalize your experience and communicate with you effectively.
Email: We collect your email address to send you important information regarding your account, updates, and communication.
Payment Information: We collect payment details to process your subscription securely. However, we do not store your payment information on our servers. Payments are processed by trusted third-party payment processors.
Resume and Cover Letter Content: We collect and store the content of resumes and cover letters you create using our service to provide document generation, editing, and export features.

1.2 Non-Personal Data

We may use web cookies and similar technologies to collect non-personal information such as your IP address, browser type, device information, and browsing patterns. This information helps us to enhance your browsing experience, analyze trends, and improve our services.

2. Purpose of Data Collection

We collect and use your personal data for service delivery and order processing. This includes generating AI-powered resume and cover letter content, processing subscriptions, sending account notifications, providing customer support, and keeping you updated about the status of your account.

3. Data Sharing

We do not share your personal data with any third parties except as required for service delivery. This includes sharing necessary information with payment processors for subscription processing and AI service providers (Google Gemini) for document generation. We do not sell, trade, or rent your personal information to others.

4. Children's Privacy

ResumePair is not intended for children under the age of 13. We do not knowingly collect personal information from children. If you are a parent or guardian and believe that your child has provided us with personal information, please contact us at the email address provided below.

5. Updates to the Privacy Policy

We may update this Privacy Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. Any updates will be posted on this page, and we may notify you via email about significant changes.

6. Contact Information

If you have any questions, concerns, or requests related to this Privacy Policy, you can contact us at:

Email: support@resumepair.com

For all other inquiries, please visit our Contact Us page on the Website.

By using ResumePair, you consent to the terms of this Privacy Policy.`}
        </pre>
      </div>
    </main>
  );
};

export default PrivacyPolicy;
