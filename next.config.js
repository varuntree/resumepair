/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      // NextJS <Image> component needs to whitelist domains for src={}
      "lh3.googleusercontent.com",
      "pbs.twimg.com",
      "images.unsplash.com",
      "logos-world.net",
    ],
  },
  // Exclude Puppeteer and Chromium from serverless bundling
  serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium'],
};

module.exports = nextConfig;
