/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Prevents duplicate WebRTC media stream initialization in dev mode
  images: {
    domains: ['images.unsplash.com', 'api.dicebear.com'],
  },
  transpilePackages: ['@mivo/types', '@mivo/config', '@mivo/ui', '@mivo/validation'],
};

module.exports = nextConfig;
