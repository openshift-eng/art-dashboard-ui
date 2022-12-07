/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    unoptimized: true,
  },
  output: 'standalone',
  // basePath: '/pub/beta/self-service',
}

module.exports = nextConfig
