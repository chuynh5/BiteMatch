/** @type {import('next').NextConfig} */
const nextConfig = {
  agentRules: false,
  devIndicators: false,
  images: {
    qualities: [75, 90],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      }
    ]
  }
};

export default nextConfig;
