/** @type {import('next').NextConfig} */
const nextConfig = {
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
  // Allow the app to work when accessed via IP address
  // Remove all frame restrictions to allow iframe embedding from anywhere
}

module.exports = nextConfig
