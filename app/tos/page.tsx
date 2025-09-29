import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";
import { Button } from "@/components/ui/button";

// CHATGPT PROMPT TO GENERATE YOUR TERMS & SERVICES — replace with your own data 👇

// 1. Go to https://chat.openai.com/
// 2. Copy paste bellow
// 3. Replace the data with your own (if needed)
// 4. Paste the answer from ChatGPT directly in the <pre> tag below

// You are an excellent lawyer.

// I need your help to write a simple Terms & Services for my website. Here is some context:
// - Website: https://resumepair.com
// - Name: ResumePair
// - Contact information: support@resumepair.com
// - Description: An AI-powered resume and cover letter builder helping users create ATS-optimized documents in under 60 seconds
// - Ownership: Users own the resumes and cover letters they create and can export them freely. Users subscribe to access AI features and templates.
// - User data collected: name, email, payment information, and resume/cover letter content
// - Non-personal data collection: web cookies
// - Link to privacy-policy: https://resumepair.com/privacy-policy
// - Governing Law: United States
// - Updates to the Terms: users will be updated by email

// Please write a simple Terms & Services for my site. Add the current date. Do not add or explain your reasoning. Answer:

export const metadata = getSEOTags({
  title: `Terms and Conditions | ${config.appName}`,
  canonicalUrlRelative: "/tos",
});

const TOS = () => {
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
          Terms and Conditions for {config.appName}
        </h1>

        <pre className="leading-relaxed whitespace-pre-wrap font-sans">
          {`Last Updated: September 30, 2025

Welcome to ResumePair!

These Terms of Service ("Terms") govern your use of the ResumePair website at https://resumepair.com ("Website") and the services provided by ResumePair. By using our Website and services, you agree to these Terms.

1. Description of ResumePair

ResumePair is an AI-powered platform that helps users create ATS-optimized resumes and cover letters in under 60 seconds, offering professional templates and AI-driven content generation.

2. Ownership and Usage Rights

Users retain full ownership of the resumes and cover letters they create using ResumePair. You may export and use your documents freely for personal or professional purposes. Subscription to ResumePair grants access to AI features, templates, and export capabilities. We offer a full refund within 7 days of purchase, as specified in our refund policy.

3. User Data and Privacy

We collect and store user data, including name, email, payment information, and the content of resumes and cover letters you create, as necessary to provide our services. For details on how we handle your data, please refer to our Privacy Policy at https://resumepair.com/privacy-policy.

4. Non-Personal Data Collection

We use web cookies to collect non-personal data for the purpose of improving our services and user experience.

5. Governing Law

These Terms are governed by the laws of the United States.

6. Updates to the Terms

We may update these Terms from time to time. Users will be notified of any changes via email.

For any questions or concerns regarding these Terms of Service, please contact us at support@resumepair.com.

Thank you for using ResumePair!`}
        </pre>
      </div>
    </main>
  );
};

export default TOS;
