/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Environment variables configuration
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_FRONTEND_PORT: process.env.NEXT_PUBLIC_FRONTEND_PORT,
  },
  
  // Optional: Custom server port from environment
  ...(process.env.NEXT_PUBLIC_FRONTEND_PORT && {
    serverRuntimeConfig: {
      port: process.env.NEXT_PUBLIC_FRONTEND_PORT,
    },
  }),
  
  // Enable experimental features if needed
  experimental: {
    // Add any experimental features here
  },
  
  // Production optimizations
  ...(process.env.NODE_ENV === 'production' && {
    compress: true,
    poweredByHeader: false,
  }),
}

module.exports = nextConfig
