/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@reduxjs/toolkit'],
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
